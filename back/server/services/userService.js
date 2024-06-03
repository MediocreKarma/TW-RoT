import {withDatabaseOperation} from "../db.js";
import {sendJsonResponse} from "../response.js";
import {ServiceResponse} from "../models/serviceResponse.js";
import {generateQuestionnaire, getSolutionService} from "./exerciseServices.js";
import client from "pg/lib/client.js";

export const addQuestionSolutionService = withDatabaseOperation(async function (
    client,
    params
){
    if (params['authorization'] === null) {
        return new ServiceResponse(401, null, 'Unauthenticated');
    }

    const userId = params['id'];
    if (userId !== params['authorization']) {
        return new ServiceResponse(403, null, 'Unauthorized');
    }

    const {questionId, answers} = params;

    answers.sort((a, b) => a['answerId'] - b['answerId']);

    let bitset = 0;
    for (const answer of answers) {
        bitset = bitset * 2 + (answer['selected'] ? 1  : 0);
    }

    const correctAnswers = (await client.query(
        'select answerid as "answerId", correct as "correct" from register_answer($1::int, $2::int, $3::int)',
        [userId, questionId, bitset],
    )).rows;

    return new ServiceResponse(200, correctAnswers, 'Successfully registered answer');
});

export const createUserQuestionnaireService = withDatabaseOperation(async function (
    client, userId
) {
     const thirtyMinutesInMs = 30 * 60 * 1000;


    return await generateQuestionnaire(userId);
})