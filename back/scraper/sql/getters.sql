drop function if exists get_users(int, int, varchar);
create or replace function get_users(
    start int, count int, search_query varchar = ''
)
    returns table (
                      id                    int,
                      username              varchar(256),
                      email                 varchar(256),
                      updated_at            timestamp,
                      roles                 int,
                      solved_questionnaires int,
                      total_questionnaires  int,
                      solved_questions      int,
                      total_questions       int
    )
as
$$
begin
    return query select ua.id,
                        ua.username,
                        ua.email,
                        ua.updated_at,
                        ua.roles,
                        ua.solved_questionnaires,
                        ua.total_questionnaires,
                        ua.solved_questions,
                        ua.total_questions
                 from user_account ua
                 where ua.username like '%' || search_query || '%'
                    or ua.email like '%' || search_query || '%'
                 order by id
                 offset start limit count;
end;
$$ language plpgsql;

drop function if exists validate_session(varchar);
create or replace function validate_session(p_token_value varchar) returns table (
    id int,
    username varchar(256),
    updated_at timestamp,
    flags int
) as $$
begin
    delete from user_token 
        where token_type = 'session' and created_at < (current_timestamp - interval '30 days');

	return query select ua.id, ua.username, ua.updated_at, ua.flags 
        from user_token ut join user_account ua
            on ut.user_id = ua.id
		where ut.token_type = 'session' and ut.token_value = p_token_value;
end;
$$ language plpgsql;
