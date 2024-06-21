import { ErrorCodes } from "../../common/constants.js";
import { isAdmin, isStringValidInteger } from "../../common/utils.js";
import { withDatabaseOperation } from "../_common/db.js"
import { ServiceResponse } from "../_common/serviceResponse.js";
import { validateAuth, validateStartAndCountParams } from "../_common/utils.js";
import { SQL_SELECT_STATEMENT, SQL_GROUPING_STATEMENT, adjustOutputAnswerSet, addImageToQuestion } from "./service.js";

const SQL_WHERE_FETCH_STATEMENT = 
    `WHERE 
        q.text LIKE '%' || $1::varchar || '%' 
        OR qc.title LIKE '%' || $1::varchar || '%' 
        OR a.description LIKE '%' || $1::varchar || '%'`;

export const fetchQuestions = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const validation = validateAuth(params['authorization']);
    if (validation instanceof ServiceResponse) {
        return validation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    const start = params['query']?.start ?? '0';
    const count = params['query']?.count ?? '5';
    const startAndCountValidation = validateStartAndCountParams(start, count);
    if (startAndCountValidation instanceof ServiceResponse) {
        return startAndCountValidation;
    }

    const query = params['query']?.query ?? '';

    if (isStringValidInteger(query)) {
        const qst = (await client.query(
            `${SQL_SELECT_STATEMENT} where q.id = $1::int ${SQL_GROUPING_STATEMENT}`,
            [query]
        )).rows;

        if (qst.length === 0) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_ID_NOT_FOUND}, 'No such question id');
        }
        
        return new ServiceResponse(200, {total: 1, data: qst[0]}, 'Successfully retrieved question');
    }

    const cnt = parseInt((await client.query(
        `SELECT 
            count(distinct q.id) as cnt
        FROM 
            question q 
            JOIN question_category qc ON q.category_id = qc.id 
            JOIN answer a ON a.question_id = q.id
        ${SQL_WHERE_FETCH_STATEMENT}`,
        [query]
    )).rows[0]['cnt'], 10);

    const result = (await client.query(
        `${SQL_SELECT_STATEMENT} ${SQL_WHERE_FETCH_STATEMENT} ${SQL_GROUPING_STATEMENT}
            offset $2::int limit $3::int`,
        [query, start, count]
    )).rows;
    result.forEach(q => {
        q.answers.sort((a, b) => a.id - b.id); 
        adjustOutputAnswerSet(q.answers);
        addImageToQuestion(q);
    });

    return new ServiceResponse(200, {total: cnt, data: result}, 'Successfully fetched questions');
})

export const addQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) {

});