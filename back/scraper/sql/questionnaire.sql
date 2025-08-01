-- create a new questionnaire or return an existing one
drop function if exists generate_questionnaire(int);
create or replace function generate_questionnaire(u_id int) 
returns table(
    questionnaire_id int,
    generated_time timestamp,
    new bool
)
as $$
declare
    category_question_count int;
    question_id int;
    questions_per_category int;
    extra_questions int;
    qc_id int;
    has_generated_questionnaire int;
    gen_time timestamp;
    already_registered bool;
    generated_qst_id int;
begin
    select 
        gq.generated_time, gq.registered 
    into 
        gen_time, already_registered 
    from generated_questionnaire gq where gq.id = u_id; -- gen_qstr has same id as user (always)

    if found then
        if gen_time >= (now()::timestamp - interval '30 minutes') and not already_registered THEN
            return query select u_id, gen_time, false;
            return;
        end if;
        if not already_registered then
            perform finish_questionnaire(u_id);
        end if;

        delete from generated_question      gq where gq.questionnaire_id = u_id;
        delete from generated_questionnaire gq where gq.id = u_id;
    end if;

    insert into generated_questionnaire (id) values (u_id);
    generated_qst_id := 26 * (u_id - 1) + 1;

    for question_id in select q.id from question q where not q.deleted order by random() limit 26 loop
        
        insert into generated_question (id, questionnaire_id, question_id, selected_fields, sent, solved)
            values (generated_qst_id, u_id, question_id, 0, false, false);

        generated_qst_id := generated_qst_id + 1;
    end loop;

    update user_account
        set updated_at = now()::timestamp
        where id = u_id;

    gen_time = now()::timestamp;

    update generated_questionnaire
        set 
            generated_time = gen_time
        where 
            id = u_id;

    return query select u_id, gen_time, true;
end; $$ language plpgsql;

-- get the questions of a questionnaire
drop function if exists get_questionnaire_questions_by_id(int);
create or replace function get_questionnaire_questions_by_id(qstr_id int) 
returns table (
    generated_question_id int,
    sent boolean,
    solved boolean,
    selected_fields int,
    question_text varchar(4096),
    question_image_id varchar(256),
    answers jsonb[]
) as $$
begin  
    return query 
        select 
            gq.id as generated_question_id,
            gq.sent,
            gq.solved,
            gq.selected_fields,
            q.text as question_text, 
            q.image_id as question_image,
            array_agg(jsonb_build_object('id', a.id, 'description', a.description, 'correct', a.correct) order by random()) as answers
        FROM
            generated_question gq
        join 
            question q
                on 
                    q.id = gq.question_id
        join answer a on q.id = a.question_id
        where 
            gq.questionnaire_id = qstr_id
        group by gq.id, q.text, q.image_id;    
end; $$ language PLPGSQL;

-- utility function to generate a bitset that marks a bit 1 for selected answer
-- and 0 for unselected, in opposite order of ids
drop function if exists get_answer_bitset(integer);
create or replace function get_answer_bitset(q_id integer) returns int
as $$
declare
    answers_correctness bool[];
    arr_length int;
    correct_bitset int := 0;
    i int;
BEGIN

    select array(select correct from answer where question_id = q_id order by id asc) into answers_correctness;
    if answers_correctness is null THEN
        return -1;
    end if;
    arr_length = array_length(answers_correctness, 1);
    for i in 1..arr_length LOOP
        correct_bitset := correct_bitset * 2 + (answers_correctness[i])::int;
    end loop;

    return correct_bitset;
    
end; $$ language PLPGSQL;

-- register an answer for a given question, unrelated to questionnaires
drop function if exists register_answer(int, int, int);
create or replace function register_answer(u_id integer, q_id integer, answer_bitset integer) 
returns table (
    answer_id int,
    correct bool
)
as $$
DECLARE
    correct_bitset int;
    correctness bool := false;
    dlt bool;
BEGIN
    select deleted into dlt from question where id = q_id;
    if not found or dlt THEN
        return;
    end if;

    correct_bitset := get_answer_bitset(q_id);
    correctness := (answer_bitset = correct_bitset);
    insert into answered_question (user_id, question_id, answered_correctly) values (u_id, q_id, correctness)
        on conflict (user_id, question_id) do update set answered_correctly = excluded.answered_correctly;
    update user_account
        set updated_at = now()::timestamp
        where id = u_id;
    return query select a.id, a.correct from answer a join question q on a.question_id = q.id where q.id = q_id;
end; $$ language PLPGSQL;

-- mark a questionnaire as finished. May be called multiple times without consequence
drop function if exists finish_questionnaire(int);
create or replace function finish_questionnaire(qstnr_id int) returns int
as $$
declare
    score int;
    already_registered bool;
begin 
    select count(' ') filter (where q.solved), qstnr.registered
        into score, already_registered
    from generated_questionnaire qstnr 
    join generated_question q 
        on qstnr.id = q.questionnaire_id 
        where qstnr.id = qstnr_id
        group by qstnr.id, qstnr.registered;

    if not found THEN
        return -1;
    end if;

    if already_registered then
        return -2;
    end if;

    update generated_questionnaire set registered = true where id = qstnr_id;
    update user_account
        set 
            updated_at = now()::timestamp,
            total_questionnaires = total_questionnaires + 1,
            solved_questionnaires = solved_questionnaires + (score >= 22)::int,
            total_questions = total_questions + 26,
            solved_questions = solved_questions + score
        where id = qstnr_id; -- same id as user

    return score;
end; $$ language plpgsql;

-- submit a solution to a questionnaire question. 
-- does not work for finished questionnaire or already send questions
drop function if exists submit_questionnaire_solution(int, int, int);
create or replace function submit_questionnaire_solution(qstr_id int, gq_id int, answer_bitset int) 
returns table (
    answer_id int,
    correct bool
)
as $$
DECLARE
    correct_bitset int;
    correctness bool := false;
    gen_time TIMESTAMP;
    q_id int;
    snt bool;
    rgstr bool;
BEGIN
    select sent, question_id
        into snt, q_id
        from generated_question
        where id = gq_id; 

    select registered, generated_time into rgstr, gen_time from generated_questionnaire where id = qstr_id;
    
    if snt or rgstr THEN
        return;
    end if;

    if gen_time < (now()::timestamp - interval '30 minutes') THEN
        perform finish_questionnaire(qstr_id);
        return;
    end if;

    correct_bitset := get_answer_bitset(q_id);
    correctness := (answer_bitset = correct_bitset);

    update generated_question
        set 
            sent = true,
            selected_fields = answer_bitset,
            solved = correctness 
        where id = gq_id;

    update user_account
        set updated_at = now()::timestamp
        where id = qstr_id; -- same id
    
    return query select a.id, a.correct from answer a join question q on a.question_id = q.id where q.id = q_id;
end; $$ language PLPGSQL;
