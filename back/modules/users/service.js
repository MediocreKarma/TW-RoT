import { expireAuthCookie } from "../../common/authMiddleware.js";
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

const validateNonnegativeIntegerField = (field, fieldName) => {
    const capitalizedFieldName = fieldName.toUpperCase();
    if (!isStringValidInteger(field)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_INTEGER`]});
    }
    const value = parseInt(field, 10);
    if (value < 0) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_NONNEGATIVE_INTEGER`]});
    }
    return null;
}

const validateStartAndCountParams = (startStr, countStr) => {
    const startValidation = validateNonnegativeIntegerField(startStr, 'start');
    if (startValidation) {
        return startValidation;
    }
    const countValidation = validateNonnegativeIntegerField(countStr, 'count');
    if (countValidation) {
        return countValidation;
    }
    return null;
}

export const deleteUser = withDatabaseOperation(async function(
    client, _req, res, params
) {
    const userId = params['path']['id'];
    if (!isStringValidInteger(userId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id');
    }
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    if (parseInt(userId, 10) !== params['authorization'].user.id && !isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    await client.query(
        `delete from user_account where id = $1::int`,
        [userId]
    );
    expireAuthCookie(res);
    return new ServiceResponse(200, null, 'Successfully deleted user account');
});

export const resetProgress = withDatabaseTransaction(async function (
    client, _req, _res, params
) {
    const userId = params['path']['id'];
    if (!isStringValidInteger(userId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id');
    }
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    await client.query(
        `update user_account 
            set
                solved_questionnaires = 0,
                total_questionnaires = 0,
                solved_questions = 0,
                total_questions = 0
            where id = $1::int`,
        [userId]
    );
    await client.query(
        `delete from generated_questionnaire where id = $1::int`,
        [userId]
    );
    await client.query(
        `delete from answered_question where user_id = $1::int`,
        [userId]
    );
    return new ServiceResponse(204, null, 'Successfully reset progress');
});

export const getLeaderboard = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const start = params['query']['start'] ?? '0';
    const count = params['query']['count'] ?? '5';
    const validation = validateStartAndCountParams(start, count);
    if (validation instanceof ServiceResponse) {
        return validation;
    }

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
    return !!((authorization?.user?.flags ?? 0) & USER_ROLES.ADMIN);
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

    const start = params['query']['start'] ??  '0';
    const count = params['query']['count'] ??  '5'; 
    const validation = validateStartAndCountParams(start, count);
    if (validation instanceof ServiceResponse) {
        return validation;
    }

    const query = params['query']['query'] ?? '';

    const userCount = parseInt((await client.query(
        `select count(' ') as cnt from user_account
            where username like '%' || $1::varchar || '%'
                    or email like '%' || $1::varchar || '%'`,
        [query]
    )).rows[0]['cnt'], 10);

    const result = (await client.query(
        `select id, username, email, updated_at as "updatedAt", flags, 
                solved_questionnaires as "solvedQuestionnaires",
                total_questionnaires as "totalQuestionnaires",
                solved_questions as "solvedQuestions",
                total_questions as "totalQuestions" 
            from get_users($1::int, $2::int, $3::varchar)`,
        [start, count, query]
    )).rows;

    return new ServiceResponse(200, {total: userCount, data: result}, 'Successfully retrieved user entries');
});

export const changeBanStatus = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    const isBanned = params['body']['banned'];
    if (isBanned === null || isBanned === undefined) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.BANNED_STATUS_NOT_IN_BODY}, 'Missing banned from body');
    }
    if (!(isBanned === false || isBanned === true)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_BANNED_STATUS}, 'Banned status not boolean');
    }
    const userId = params['path']['id'];
    if (!isStringValidInteger(userId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id');
    }

    const updated = (await client.query(
        `update user_account 
            set flags = (
                case
                    when $1::boolean then flags | 4,
                    else flags & ~4
                end
            )
            where id = $2::int and flags & 1 = 0`,
        [isBanned, userId]
    )).rowCount;

    if (updated === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.NO_BANNABLE_USER_FOUND}, `Couldn't ban given id`);
    }
    return new ServiceResponse(200, null, 'Successfully banned user');
});