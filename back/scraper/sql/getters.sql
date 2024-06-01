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
