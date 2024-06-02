drop function generate_questionnaire(int);


-- TODO: PE AICEA CEVA
create or replace function generate_questionnaire(u_id int) 
returns table(
    question_id int,
    question_text varchar(4096),
    question_image varchar(512),
    answer_id int,
    answer_description varchar(2048)
)
as $$
declare
    questionnaire_id int;
    category_count int;
    category_question_count int;
    question_id int;
    questions_per_category int;
    extra_questions int;
    qc_id int;
    has_generated_questionnaire int;
begin
    select gq.id into questionnaire_id from generated_questionnaire gq where gq.user_id = u_id;
    if found then
        return select ;
    end if;

    -- create a new questionnaire entry
    insert into generated_questionnaire (user_id)
        values (u_id)
    returning id into questionnaire_id;
    
    -- get the number of categories
    select count(' ') into category_count from question_category;
    
    -- calculate the base number of questions per category and the extra questions
    questions_per_category := 26 / category_count;
    extra_questions := 26 % category_count;
    
    -- loop through each category
    for qc_id in select qc.id from question_category qc order by random() loop
        
        category_question_count := questions_per_category;
        -- calculate the number of questions to select from this category
        if extra_questions > 0 then
            category_question_count := questions_per_category + 1;
            extra_questions := extra_questions - 1;
        end if;
        
        -- fetch questions and insert them into generated_question table
        for question_id in select q.id from question q where q.category_id = qc_id order by random() limit category_question_count loop
            
            insert into generated_question (questionnaire_id, question_id, selected_fields, sent, solved)
                values (questionnaire_id, question_id, 0, false, false);

            return query select 
                    q.id as question_id,
                    q.text as question_text,
                    q.image_id as question_image,
                    a.id as answer_id,
                    a.description as answer_description
                from question q
                join answer a
                    on q.id = a.question_id
                where q.id = question_id;

        end loop;
    end loop;

    update generated_questionnaire
        set 
            generated_time = current_timestamp
        where 
            id = questionnaire_id;

    return questionnaire_id;

end; $$ language plpgsql;

create or replace function get_answer_bitset(q_id integer) returns int
as $$
declare
    answers_correctness bool[];
    arr_length int;
    correct_bitset int := 0;
    i int;
BEGIN

    select array(select correct from answer where question_id = q_id order by id) into answers_correctness;
    arr_length = array_length(answers_correctness, 1);

    for i in 1..arr_length LOOP
        if answers_correctness[i] then
            correct_bitset := correct_bitset | (1 << (i - 1));
        end if;
    end loop;

    return correct_bitset;
    
end; $$ language PLPGSQL;

create or replace function register_answer(u_id integer, q_id integer, answer_bitset integer) returns int 
as $$
DECLARE
    correct_bitset int;
    correctness bool := false;
BEGIN
    correct_bitset := get_answer_bitset(q_id);
    correctness := (answer_bitset = correct_bitset);
    insert into answered_question (user_id, question_id, answered_correctly) values (u_id, q_id, correctness)
        on conflict (user_id, question_id) do update set answered_correctly = excluded.answered_correctly;
    return correct_bitset;
end; $$ language PLPGSQL;

create or replace function finish_questionnaire(user_id int) returns int
as $$
declare
    qstnr_id int;
    score int;
begin 
    select qstnr.id, count(' ') filter (where q.solved)
        into qstnr_id, score
    from generated_questionnaire qstnr 
    join generated_question q 
        on qstnr.id = q.questionnaire_id 
        where qstnr.user_id = 1
        group by qstnr.id;

    if not found THEN
        return -1;
    end if;


    delete from generated_question      gq where gq.questionnaire_id = qstnr_id;
    delete from generated_questionnaire gq where gq.id = qstnr_id;

    update user_account
        set 
            total_questionnaires = total_questionnaires + 1,
            solved_questionnaires = solved_questionnaires + (score >= 22)::int,
            total_questions = total_questions + 26,
            solved_questions = solved_questions + score
        where id = user_id;

    return score;
end; $$ language plpgsql;
