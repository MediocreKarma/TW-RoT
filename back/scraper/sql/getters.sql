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