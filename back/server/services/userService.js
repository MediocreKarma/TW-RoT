import {withDatabaseOperation} from "../db.js";
import {ServiceResponse} from "../models/serviceResponse.js";
import {generateQuestionnaireService} from "./exerciseServices.js";

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
        'select answer_id as "answerId", correct as "correct" from register_answer($1::int, $2::int, $3::int)',
        [userId, questionId, bitset],
    )).rows;

    return new ServiceResponse(200, correctAnswers, 'Successfully registered answer');
});

export const createUserQuestionnaireService = withDatabaseOperation(async function (
    client, params
) {
    const userId = params['id'];
    if (userId !== params['authorization']) {
        return new ServiceResponse(403, null, 'Unauthorized');
    }

    const thirtyMinutesInMs = 30 * 60 * 1000;
    const questionnaireObj = (await generateQuestionnaireService(userId)).body;
    if (questionnaireObj['new']) {
        setTimeout(() => {
            client.query('perform finish_questionnaire($1::int)', [userId]);}, thirtyMinutesInMs);
    }
    const result = (await client.query(
        `select 
            generated_question_id as "generatedQuestionId",
            question_text as "questionText",
            question_image as "questionImage",
            answers as "answers"
        from get_questionnaire_by_id($1::int)`,
        [questionnaireObj['id']]
    )).rows;

    return new ServiceResponse(200, result, 'Successfully created questionnaire');
});