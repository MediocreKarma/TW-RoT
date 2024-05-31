set schema 'tw_rot';

drop table chapter cascade;

drop table sign_category cascade;

drop table sign cascade;

drop table user_account cascade;

drop table user_token cascade;

drop table question_category cascade;

drop table question cascade;

drop table answer cascade;

drop table answered_question cascade;

drop table comparison_category cascade;

drop table comparison cascade;

drop table comparison_sign cascade;

drop table generated_questionnaire cascade;

drop table generated_question cascade;

create table chapter (
    id serial primary key,
    number int,
    title varchar(128),
    content text
);

create table sign_category (
    id serial primary key,
    title varchar(256) unique not null,
    image_id varchar(64),
    design text,
    purpose text,
    suggestion text
);

create table sign(
    id serial primary key,
    category_id int references sign_category (id),
    title varchar(256) unique not null,
    description varchar(2048),
    image_id varchar(64)
);

create table user_account (
    id serial primary key,
    username varchar(256),
    email varchar(256),
    hash varchar(128),
    salt varchar(128),
    updated_at timestamp,
    roles int,
    solved_questionnaires int,
    total_questionnaires int,
    solved_questions int,
    total_questions int
);

create table user_token (
    id serial primary key,
    user_id int references user_account (id),
    token_type varchar(32) check (
        token_type in ('session', 'change_password')
    ),
    token_value varchar(128) unique not null,
    created_at timestamp
);

create table question_category (
    id serial primary key,
    title varchar(256)
);

create table question (
    id serial primary key,
    category_id int references question_category (id),
    text varchar(4096),
    image_id varchar(64)
);

create table answer (
    id serial primary key,
    question_id int references question (id),
    description varchar(4096),
    correct bool
);

create table generated_questionnaire (
    id serial primary key,
    generated_time timestamp,
    user_id int references user_account (id) unique
);

create table generated_question (
    id serial primary key,
    questionnaire_id int references generated_questionnaire (id),
    question_id int references question (id),
    selected_fields int,
    sent bool,
    solved bool
);

create table answered_question (
    id bigserial primary key,
    user_id int references user_account (id),
    question_id int references question (id),
    answered_correctly bool
);

create table comparison_category (
    id serial primary key,
    title varchar(256)
);

create table comparison (
    id serial primary key,
    category_id int references comparison_category (id),
    title varchar(256)
);

create table comparison_sign (
    id serial primary key,
    comparison_id int references comparison (id),
    image_id varchar(64),
    country varchar(128)
);

create or replace procedure insert_question_category(category_data jsonb) as $$
declare
	category_id int;
	question_record jsonb;
	question_id int;
	answer_record jsonb;
	answer_text varchar(4096);
	answer_correct boolean;
begin
	
	select qg.id into category_id from question_category qg where title = category_data->>'id';
	
	if not found then
	
		insert into question_category values (default, category_data->>'id') 
			returning id into category_id;
			
	end if;
	
	for question_record in select * from jsonb_array_elements(category_data->'questions') loop
		
		insert into question 
			values (default, category_id, question_record->>'question', question_record->>'image')
			returning id into question_id;
		
		for answer_record in select * from jsonb_array_elements(question_record->'answerNodes') loop
			
			insert into answer 
				values (default, question_id, answer_record->>'text', (answer_record->>'isCorrect')::BOOL);
			
		end loop;
		
	end loop;
	
end;
$$ language plpgsql;

create or replace function is_valid_session(p_user_id int, p_token_value varchar) returns bool as $$
declare
	token_record record;
begin
	select id, created_at into token_record from user_token ut 
		where ut.user_id = p_user_id and ut.token_type = 'session' and ut.token_value = p_token_value;
		
	if token_record is null then
		return false;
	end if;
	
	if token_record.created_at < (current_timestamp - interval '30 days') then
		delete from user_token where id = token_record.id;
		return false;
	end if;
	
	return true;
end;
$$ language plpgsql;

CREATE OR REPLACE FUNCTION generate_questionnaire(user_id int) 
RETURNS int AS $$
DECLARE
    new_questionnaire_id int;
    question_count int := 26;
    category_record RECORD;
    question_record RECORD;
    question_ids int[];
    selected_question_count int := 0;
    category_count int;
    questions_per_category int;
BEGIN
    -- Create a new generated_questionnaire
    INSERT INTO generated_questionnaire (generated_time, user_id)
    VALUES (CURRENT_TIMESTAMP, user_id)
    RETURNING id INTO new_questionnaire_id;

    -- Get the number of categories
    SELECT COUNT(*) INTO category_count FROM question_category;

    -- Determine the number of questions to select per category
    questions_per_category := question_count / category_count;

    -- Loop through each category and select questions
    FOR category_record IN
        SELECT * FROM question_category
    LOOP
        -- Select random questions from the current category
        FOR question_record IN
            SELECT id FROM question
            WHERE category_id = category_record.id
            ORDER BY random()
            LIMIT questions_per_category
        LOOP
            -- Insert the selected question into generated_question
            INSERT INTO generated_question (questionnaire_id, question_id, selected_fields, sent, solved)
            VALUES (new_questionnaire_id, question_record.id, 0, false, false);

            -- Increment the count of selected questions
            selected_question_count := selected_question_count + 1;

            -- If we have selected 26 questions, exit the loop
            IF selected_question_count >= question_count THEN
                RETURN new_questionnaire_id;
            END IF;
        END LOOP;
    END LOOP;

    -- If not enough questions have been selected, fill the remaining slots with random questions
    IF selected_question_count < question_count THEN
        FOR question_record IN
            SELECT id FROM question
            WHERE id NOT IN (
                SELECT question_id FROM generated_question WHERE questionnaire_id = new_questionnaire_id
            )
            ORDER BY random()
            LIMIT (question_count - selected_question_count)
        LOOP
            -- Insert the additional questions into generated_question
            INSERT INTO generated_question (questionnaire_id, question_id, selected_fields, sent, solved)
            VALUES (new_questionnaire_id, question_record.id, 0, false, false);
        END LOOP;
    END IF;

    RETURN new_questionnaire_id;
END;
$$ LANGUAGE plpgsql;

create or replace function get_users(start int, count int, search_query varchar = '') returns table(
	id int,
	username varchar(256),
	email varchar(256),
	updated_at timestamp,
	roles int,
	solved_questionnaires int,
	total_questionnaires int,
	solved_questions int,
	total_questions int
) as $$
begin
	return query select 
		ua.id, 
		ua.username, 
		ua.email, 
		ua.updated_at, 
		ua.roles, 
		ua.solved_questionnaires, 
		ua.total_questionnaires, 
		ua.solved_questions, 
		ua.total_questions
	from user_account ua 
		where ua.username like '%'||search_query||'%' or 
			ua.email like '%'||search_query||'%'
		order by id asc 
	offset start 
	limit count;
end;
$$ language plpgsql;

do $$
declare
	user_id integer;
begin
	insert into user_account values(default, 'name', 'email', 'hash', 'salt', current_timestamp, 0, 0, 0, 0, 0) returning id into user_id;
	insert into user_token   values(default, user_id, 'session', 'aaaaaa', current_timestamp);
end $$;