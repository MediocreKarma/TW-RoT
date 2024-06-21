import { ErrorCodes } from "../../common/constants";
import { isAdmin, isStringValidInteger } from "../../common/utils";
import { withDatabaseOperation } from "../_common/db"
import { ServiceResponse } from "../_common/serviceResponse";
import { validateAuth, validateStartAndCountParams } from "../_common/utils";

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
        const qId = parseInt(query, 10);
        const qst = (await client.query(
            `select `
        )).rows;
    }

    const cnt = parseInt((await client.query(
        `select count(' ') from question`
    )).rows[0]['cnt'], 10);
})

export const addQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) {

});