import { ErrorCodes } from "../../common/constants.js";
import { isStringValidInteger } from "../../common/utils.js";
import { ServiceResponse } from "../_common/serviceResponse.js";
import { withDatabaseOperation } from "../_common/db.js";
import { addImageToQuestion, adjustOutputAnswerSet } from "./service.js";

const calculateBitsetOfAnswers = (answers, fieldName = 'selected') => {
    answers.sort((a, b) => a['answerId'] - b['answerId']);

    let bitset = 0;
    for (const answer of answers) {
        bitset = bitset * 2 + (answer[fieldName] ? 1  : 0);
    }

    return bitset;
}

const validateAuth = (auth, userId = -1) => {
    if (!Number.isInteger(auth?.user.id)) {
        return new ServiceResponse(401, {errorCode: ErrorCodes.UNAUTHENTICATED}, 'Unauthenticated');
    }
    if (userId === -1) {
        return null;
    }
    if (!isStringValidInteger(userId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id format');
    }
    if (Number.parseInt(userId, 10) !== auth.user.id) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    return null;
}

const isBoolean = (bool) => !!bool === bool;

const validateId = (id, name) => {
    const capitalizedName = name.toUpperCase();
    if (!id && id !== 0) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedName}_NOT_IN_BODY`]});
    }
    if (!Number.isInteger(id)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`INVALID_${capitalizedName}`]});
    }
    return null;
}

const adjustQuestionnaireOutputAnswerSets = (questions) => {
    questions.forEach((question) => adjustOutputAnswerSet(question.answers));
    return questions;
}

export const addQuestionSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']['id'];
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }
    const {questionId, answers} = params['body'];
    const questionIdValidation = validateId(questionId, 'question_id');
    if (questionIdValidation) {
        return questionIdValidation;
    }
    const answerIds = Array.from({length: answers.length}, _ => false);
    for (const answer of answers) {
        const answerIdValidation = validateId(answer['answerId'], 'answer_id');
        if (answerIdValidation) {
            return answerIdValidation;
        }
        if (!isBoolean(answer['selected'])) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_ANSWER_FORMAT}, 'Missing selected property');
        }
        if (answer['answerId'] < 0) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_ID_TOO_LOW}, 'Answer id too low');
        }
        if (answer['answerId'] > answerIds.length) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_ID_TOO_HIGH}, 'Answer id too high');
        }
        answerIds[answer['answerId']] = true;
    }
    if (!answerIds.every((b) => b)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.REPEATED_ANSWER_IDS}, 'Answer id was repeated');
    }

    const bitset = calculateBitsetOfAnswers(answers);
    const correctAnswers = adjustOutputAnswerSet((await client.query(
        'select answer_id as "answerId", correct as "correct" from register_answer($1::int, $2::int, $3::int)',
        [userId, questionId, bitset],
    )).rows);
    const correctBitset = calculateBitsetOfAnswers(correctAnswers, 'correct');

    return new ServiceResponse(
        200, 
        {isCorrect: correctBitset === bitset, correctAnswers: correctAnswers}, 
        'Successfully registered answer'
    );
});

const addImageToQuestions = (questions) => {
    questions.forEach((question) => addImageToQuestion(question));
    return questions;
}

export const getQuestionnaire = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']['id'];
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }

    const questionnaireResult = (await client.query(
        `select gq.id, gq.generated_time as "generatedTime", gq.registered from 
            generated_questionnaire gq 
            join user_account ua on ua.id = gq.user_id 
            where ua.id = $1::int`,
        [userId]
    )).rows;    
    if (questionnaireResult.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.NO_USER_QUESTIONNAIRE}, 'User has never generated a questionnaire');
    }
    const questionnaire = questionnaireResult[0];
    const result = (await client.query(
        `select 
            generated_question_id as "generatedQuestionId",
            question_text as "questionText",
            question_image_id as "questionImageId",
            answers as "answers"
        from 
            get_questionnaire_questions_by_id($1::int)`,
        [questionnaire['id']]
    )).rows;

    adjustQuestionnaireOutputAnswerSets(result);
    addImageToQuestions(result);

    return new ServiceResponse(
        200,
        {questionnaire : questionnaire, questions: result},
        'Successfully registered questionnaire service'
    );
});

export const createQuestionnaire = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']['id'];
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }

    const thirtyMinutesInMs = 30 * 60 * 1000;
    const questionnaireObj = (await client.query(
        'select ' +
            '    questionnaire_id as "id", ' +
            '    generated_time as "generationTime", ' +
            '    new as "new" ' +
            'from generate_questionnaire($1::int)',
        [userId]
    )).rows[0];
    if (questionnaireObj['new']) {
        setTimeout(
            withDatabaseOperation((client) => {
                client.query('perform finish_questionnaire($1::int)', [userId]);
            }),
            thirtyMinutesInMs
        );
    }
    const result = (await client.query(
        `select 
            generated_question_id as "generatedQuestionId",
            question_text as "questionText",
            question_image_id as "questionImageId",
            answers as "answers"
        from get_questionnaire_questions_by_id($1::int)`,
        [questionnaireObj['id']]
    )).rows;

    adjustQuestionnaireOutputAnswerSets(result);
    addImageToQuestions(result);

    return new ServiceResponse(
        200,
        {questions: result, questionnaire: questionnaireObj},
        'Successfully created questionnaire'
    );
});

export const submitQuestionnaireSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['authorization'];
    if (!Number.isInteger(userId)) {
        return new ServiceResponse(403, null, 'Unauthorized');
    }
    const {questionnaireId, gqId, answers} = params;
    const bitset = calculateBitsetOfAnswers(answers);

    const result = (await client.query(
        `select 
            answer_id as "answerId",
            correct as "correct"
        from submit_questionnaire_solution($1::int, $2::int, $3::int, $4::int)`,
        [userId, questionnaireId, gqId, bitset]
    )).rows;

    return new ServiceResponse(200, result, 'Successfully submitted questionnaire');
});