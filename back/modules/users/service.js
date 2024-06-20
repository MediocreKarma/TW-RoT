import { ErrorCodes, USER_ROLES } from "../../common/constants.js";
import { isStringValidInteger } from "../../common/utils.js";
import {withDatabaseOperation, withDatabaseTransaction} from "../_common/db.js";
import {ServiceResponse} from "../_common/serviceResponse.js";

const validateAuth = (authorization) => {
    if (Number.isInteger(authorization?.errorCode)) {
        return new ServiceResponse(401, {errorCode: authorization?.errorCode}, 'Unauthenticated');
    }
    return null;
}

export const deleteUser = withDatabaseTransaction(async function(
    client, _req, _res, params
) {
    const userId = params['path']['id'];
    if (!isStringValidInteger(userIdString)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id');
    }
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    if (parseInt(userIdString, 10) !== params['authorization'].user.id || !isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    await client.query(
        `delete from user_account where id = $1::int`,
        [userId]
    );
    return new ServiceResponse(200, null, 'Successfully deleted user account');
});

export const getLeaderboard = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const start = params['query']['start'] ?? 0;
    const count = params['query']['count'] ?? 5;

    const entries = parseInt((await client.query(
        `select count(' ') as cnt from user_account where total_questions != 0`
    )).rows[0]['cnt'], 10);

    const result = (await client.query(
        `select ua.id,
                ua.username,
                ua.solved_questionnaires as "solvedQuestionnaires",
                ua.total_questionnaires as "totalQuestionnaires",
                ua.solved_questions as "solvedQuestions",
                ua.total_questions as "totalQuestions"
            from user_account ua
            where ua.total_questions != 0
            order by ua.solved_questions
            offset $1::int limit $2::int`,
        [start, count]
    )).rows;

    return new ServiceResponse(200, {total: entries, data: result}, 'Successfully retrieved leaderboard entries');
});

const isAdmin = (authorization) => {
    return !!((authorization?.user?.roles ?? 0) & USER_ROLES.ADMIN);
}

export const getUsers = withDatabaseOperation(async function(
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    
    const start = params['query']['start'] ??  0;
    const count = params['query']['count'] ??  5;
    const query = params['query']['query'] ?? '';

    const userCount = parseInt((await client.query(
        `select count(' ') from user_account`
    )).rows[0]['cnt'], 10);

    const result = (await client.query(
        `select id, username, email, updated_at as "updatedAt", roles, 
                solved_questionnaires as "solvedQuestionnaires",
                total_questionnaires as "totalQuestionnaires",
                solved_questions as "solvedQuestions",
                total_questions as "totalQuestions" 
            from get_users($1::int, $2::int, $3::varchar)`,
        [start, count, query]
    ));

    return new ServiceResponse(200, {total: userCount, data: result}, 'Successfully retrieved user entries');
});