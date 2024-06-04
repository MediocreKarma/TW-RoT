drop function generate_questionnaire(int);

create or replace function generate_questionnaire(u_id int) 
returns table(
    questionnaire_id int,
    generated_time timestamp,
    new bool
)
as $$
declare
    qstnr_id int;
    category_count int;
    category_question_count int;
    question_id int;
    questions_per_category int;
    extra_questions int;
    qc_id int;
    has_generated_questionnaire int;
    gen_time timestamp;
    already_registered bool;
begin
    select 
        gq.id, gq.generated_time, gq.registered 
    into 
        qstnr_id, gen_time, already_registered 
    from generated_questionnaire gq where gq.user_id = u_id;

    if found and  then

        raise notice '% % %', qstnr_id, gen_time, (current_timestamp - interval '30 minutes');
        if gen_time >= (current_timestamp - interval '30 minutes') THEN
            return query select qstnr_id, gen_time, false;
            return;
        end if;
        raise notice 'but here';
        if not already_registered then
            perform finish_questionnaire(u_id);
        end if;

        delete from generated_question      gq where gq.questionnaire_id = qstnr_id;
        delete from generated_questionnaire gq where gq.id = qstnr_id;
    end if;

    insert into generated_questionnaire (user_id)
        values (u_id)
    returning id into qstnr_id;
    
    select count(' ') into category_count from question_category;
    
    questions_per_category := 26 / category_count;
    extra_questions := 26 % category_count;
    
    for qc_id in select qc.id from question_category qc order by random() loop
        
        category_question_count := questions_per_category;
        if extra_questions > 0 then
            category_question_count := questions_per_category + 1;
            extra_questions := extra_questions - 1;
        end if;
        
        for question_id in select q.id from question q where q.category_id = qc_id order by random() limit category_question_count loop
            
            insert into generated_question (questionnaire_id, question_id, selected_fields, sent, solved)
                values (qstnr_id, question_id, 0, false, false);
        end loop;
    end loop;

    gen_time := current_timestamp;

    update generated_questionnaire
        set 
            generated_time = gen_time
        where 
            id = qstnr_id;

    return query select qstnr_id, gen_time, true;
end; $$ language plpgsql;

create type answer_t as (
    id int, 
    description varchar(4096)
);

create or replace function get_questionnaire_by_id(qstr_id int) 
returns table (
    generated_question_id int,
    question_text varchar(4096),
    question_image varchar(256),
    answers jsonb[]
) as $$
begin  
    return query 
        select 
            gq.id as generated_question_id, 
            q.text as question_text, 
            q.image_id as question_image,
            array_agg(jsonb_build_object('id', a.id, 'description', a.description)) as answer
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

create or replace function get_questionnaire_by_user_id(u_id int) 
returns table (
    generated_question_id int,
    question_text varchar(4096),
    question_image varchar(256),
    answers jsonb[]
) as $$
begin  
    return query 
        select 
            gq.id as generated_question_id, 
            q.text as question_text, 
            q.image_id as question_image,
            array_agg(jsonb_build_object('id', a.id, 'description', a.description)) as answer
        FROM
            generated_question gq
        join 
            question q
                on q.id = gq.question_id
        join answer a 
            on q.id = a.question_id
        join generated_questionnaire qstr
            on qstr.id = gq.questionnaire_id
        where 
            qstr.user_id = u_id
        group by gq.id, q.text, q.image_id;   
end; $$ language PLPGSQL;


create or replace function get_answer_bitset(q_id integer) returns int
as $$
declare
    answers_correctness bool[];
    arr_length int;
    correct_bitset int := 0;
    i int;
BEGIN

    select array(select correct from answer where question_id = q_id order by id asc) into answers_correctness;
    arr_length = array_length(answers_correctness, 1);
    for i in 1..arr_length LOOP
        correct_bitset := correct_bitset * 2 + (answers_correctness[i])::int;
    end loop;

    return correct_bitset;
    
end; $$ language PLPGSQL;

create or replace function register_answer(u_id integer, q_id integer, answer_bitset integer) 
returns table (
    answer_id int,
    correct bool
)
as $$
DECLARE
    correct_bitset int;
    correctness bool := false;
BEGIN
    correct_bitset := get_answer_bitset(q_id);
    correctness := (answer_bitset = correct_bitset);
    insert into answered_question (user_id, question_id, answered_correctly) values (u_id, q_id, correctness)
        on conflict (user_id, question_id) do update set answered_correctly = excluded.answered_correctly;
    return query select a.id, a.correct from answer a join question q on a.question_id = q.id where q.id = q_id;
end; $$ language PLPGSQL;

select register_answer(1, 2, 2);

create or replace function finish_questionnaire(user_id int) returns int
as $$
declare
    qstnr_id int;
    score int;
    already_registered bool;
begin 
    select qstnr.id, count(' ') filter (where q.solved), qstnr.registered
        into qstnr_id, score, already_registered
    from generated_questionnaire qstnr 
    join generated_question q 
        on qstnr.id = q.questionnaire_id 
        where qstnr.user_id = 1
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
            total_questionnaires = total_questionnaires + 1,
            solved_questionnaires = solved_questionnaires + (score >= 22)::int,
            total_questions = total_questions + 26,
            solved_questions = solved_questions + score
        where id = user_id;

    return score;
end; $$ language plpgsql;

create or replace function submit_questionnaire_solution(u_id int, qstr_id int, gq_id int, answer_bitset int) 
returns table (
    answer_id int,
    correct bool
)
as $$
DECLARE
    correct_bitset int;
    correctness bool := false;
    q_id int;
    actual_qstr_id int;
    actual_user_id int;
BEGIN
    select gq.question_id, gq.questionnaire_id, gq.user_id 
        into q_id, actual_qstr_id, actual_user_id 
        from generated_question gq where gq.id = gq_id; 

    if actual_qstr_id != qstr_id THEN
        raise exception '1:Invalid questionnaire id';
    end if;
    if actual_user_id != u_id THEN
        raise exception '2:Wrong user id';
    end if;

    correct_bitset := get_answer_bitset(q_id);
    correctness := (answer_bitset = correct_bitset);
    update generated_question
        set 
            sent = true,
            selected_fields = bitset,
            solved = correctness 
        where id = gq_id;
    return query select a.id, a.correct from answer a join question q on a.question_id = q.id where q.id = q_id;
end; $$ language PLPGSQL;
