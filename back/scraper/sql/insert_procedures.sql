create or replace procedure insert_question_category(
    category_data jsonb
)
as
$$
declare
    category_id int;
    question_record jsonb;
    question_id int;
    answer_record jsonb;
begin

    select qg.id into category_id from question_category qg where title = category_data ->> 'id';
    if not found then
        insert into question_category
        values (
                   default, category_data ->> 'id'
               )
        returning id into category_id;
    end if;

    for question_record in select * from jsonb_array_elements(category_data -> 'questions')
    loop

        insert into question
        values (
                   default, category_id, question_record ->> 'question', question_record ->> 'image'
               )
        returning id into question_id;

        for answer_record in select * from jsonb_array_elements(question_record -> 'answerNodes')
        loop

            insert into answer
            values (
                       default, question_id, answer_record ->> 'text', (answer_record ->> 'isCorrect')::bool
                   );
        end loop;
    end loop;

end;
$$ language plpgsql;


create or replace procedure insert_sign_category(
    category_data jsonb
)
as
$$
declare
    category_id int;
    sign_record jsonb;
    sign_id int;
begin
    select sc.id into category_id from sign_category sc where category_data ->> 'title' = sc.title;
    if not found then
        insert into sign_category
        values (
                   default, category_data ->> 'title', category_data ->> 'image'
               )
        returning id into category_id;
    end if;

    for sign_record in select * from jsonb_array_elements(category_data -> 'signs') loop

        select s.id into sign_id from sign s where s.title = sign_record ->> 'title';
        if not found then
            insert into sign (id, title, description, image_id)
            values (
                default, sign_record ->> 'title',
                sign_record ->> 'description', sign_record ->> 'image'
            )
            returning id into sign_id;
        end if;

        insert into sign_to_category_relation values (
            default, category_id, sign_id
        );

    end loop;

end;
$$ language plpgsql;