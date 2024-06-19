-- Active: 1717142263895@@127.0.0.1@5432@tw_rot@tw_rot
set schema 'tw_rot';

drop table if exists chapter cascade;

drop table if exists sign_category cascade;

drop table if exists sign cascade;

drop table if exists sign_to_category_relation cascade;

drop table if exists user_account cascade;

drop table if exists user_token cascade;

drop table if exists question_category cascade;

drop table if exists question cascade;

drop table if exists answer cascade;

drop table if exists answered_question cascade;

drop table if exists comparison_category cascade;

drop table if exists comparison cascade;

drop table if exists comparison_sign cascade;

drop table if exists generated_questionnaire cascade;

drop table if exists generated_question cascade;

create table chapter (
    id serial primary key,
    number int,
    title varchar(128),
    content text,
    isAddendum bool default false
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
    username varchar(256) unique not null,
    email varchar(256) unique default null,
    new_email varchar(256) unique default null,
    hash varchar(128),
    updated_at timestamp default current_timestamp,
    flags int default 0,
    solved_questionnaires int default 0,
    total_questionnaires int default 0,
    solved_questions int default 0,
    total_questions int default 0
);

create table user_token (
    id serial primary key,
    user_id int references user_account (id),
    token_type varchar(32) check (
        token_type in ('session', 'change_password', 'change_email', 'change_username', 'confirm_email')
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
    user_id int references user_account (id) unique,
    registered bool default false
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