set schema 'tw_rot';

drop table chapter cascade;

drop table sign_category cascade;

drop table sign cascade;

drop table sign_to_category_relation cascade;

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
    image_id varchar(256),
    design text,
    purpose text,
    suggestion text
);

create table sign(
    id serial primary key,
    title varchar(256) unique,
    description varchar(2048),
    image_id varchar(256)
);

create table sign_to_category_relation (
    id serial primary key,
    category_id int references sign_category (id),
    sign_id int references sign(id)
);

create table user_account (
    id serial primary key,
    username varchar(256),
    email varchar(256) unique not null,
    hash varchar(128),
    salt varchar(128),
    updated_at timestamp default current_timestamp,
    roles int default 0,
    solved_questionnaires int default 0,
    total_questionnaires int default 0,
    solved_questions int default 0,
    total_questions int default 0
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
    title varchar(256) unique
);

create table question (
    id serial primary key,
    category_id int references question_category (id),
    text varchar(4096),
    image_id varchar(256)
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
    answered_correctly bool,
    unique(user_id, question_id)
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
    image_id varchar(512),
    country varchar(128)
);