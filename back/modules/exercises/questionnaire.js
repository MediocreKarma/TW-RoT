import { ErrorCodes } from "../../common/constants.js";
import { isStringValidInteger } from "../../common/utils.js";
import { ServiceResponse } from "../_common/serviceResponse.js";
import { withDatabaseOperation } from "../_common/db.js";
import { addImageToQuestion, adjustOutputAnswerSet } from "./service.js";

const thirtyMinutesInMs = 30 * 60 * 1000;

const calculateBitsetOfAnswers = (answers, fieldName = 'selected') => {
    answers.sort((a, b) => a['id'] - b['id']);

    let bitset = 0;
    for (const answer of answers) {
        bitset = bitset * 2 + (answer[fieldName] ? 1  : 0);
    }

    return bitset;
}

const validateAuth = (auth, userId = -1) => {
    if (!Number.isInteger(auth?.user?.id)) {
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

export const validateAnswerSetInput = (answers, booleanProperty = 'selected', validateDescription = true, validateId = true) => {
    if (!answers) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWERS_NOT_IN_BODY}, 'Answers id not in body');
    }
    const answerIds = Array.from({length: answers.length + 1}, _ => false);
    answerIds[0] = true;
    let i = 1;
    for (const answer of answers) {
        const answerIdValidation = validateId(validateId ? i : answer['id'], 'answer_id');
        if (answerIdValidation) {
            return answerIdValidation;
        }
        if (!isBoolean(answer[booleanProperty])) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_MISSING_BOOLEAN_PROPERTY}, `Missing ${booleanProperty} property`);
        }
        if (validateDescription && !answer.description) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_MISSING_DESCRIPTION}, `Missing description in answer`);
        }
        if (answer['id'] < 1) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_ID_TOO_LOW}, 'Answer id too low');
        }
        if (answer['id'] >= answerIds.length) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.ANSWER_ID_TOO_HIGH}, 'Answer id too high');
        }
        answerIds[validateId ? i : answer['id']] = true;
        i++;
    }
    if (!answerIds.every((b) => b)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.REPEATED_ANSWER_IDS}, 'Answer id was repeated');
    }
    return null;
}

export const addQuestionSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']?.id;
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }
    const answers = params['body']?.answers;
    const questionId = params['body']?.id;
    const questionIdValidation = validateId(questionId, 'question_id');
    if (questionIdValidation) {
        return questionIdValidation;
    }
    const answerInputValidation = validateAnswerSetInput(answers);
    if (answerInputValidation) {
        return answerInputValidation;
    }
    const bitset = calculateBitsetOfAnswers(answers);
    const correctAnswers = adjustOutputAnswerSet((await client.query(
        'select answer_id as "id", correct as "correct" from register_answer($1::int, $2::int, $3::int)',
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

const markQuestionnaireFinished = async (client, userId) => {
    await client.query('select finish_questionnaire($1::int)', [userId]);
}

const getQuestionnaireQuestions = async (client, qstrId) => {
    return (await client.query(
        `select 
            generated_question_id as "id",
            question_text as "text",
            question_image_id as "imageId",
            answers,
            sent,
            solved,
            selected_fields as "selectedFields"
        from 
            get_questionnaire_questions_by_id($1::int)`,
        [qstrId]
    )).rows;
}

const addSelectedToAnswers = async (question) => {
    if (question?.selectedFields === undefined || question?.answers === undefined) {
        return question;
    }
    question.answers.sort((a, b) => a['id'] - b['id']);
    let bitset = question.selectedFields;
    for (let i = question.answers.length - 1; i >= 0; --i) {
        question.answers[i]['selected'] = (bitset % 2 !== 0);
        bitset = Math.floor(bitset / 2);
    }
}

const addSelectedToQuestionSet = async (questions) => {
    questions.forEach(q => addSelectedToAnswers(q));
    return questions;
}

export const getQuestionnaire = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']?.id;
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }

    const questionnaireResult = (await client.query(
        `select gq.id, gq.generated_time as "generatedTime", gq.registered from 
            generated_questionnaire gq where gq.id = $1::int`,
        [userId]
    )).rows;    
    if (questionnaireResult.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.NO_USER_QUESTIONNAIRE}, 'User has never generated a questionnaire');
    }
    const questionnaire = questionnaireResult[0];
    if (!questionnaire['registered'] && questionnaire['generatedTime'].getTime() + thirtyMinutesInMs < new Date().getTime()) {
        questionnaire['registered'] = true;
        markQuestionnaireFinished(client, userId);
    }

    const result = await getQuestionnaireQuestions(client, questionnaire['id']);

    adjustQuestionnaireOutputAnswerSets(result);
    addImageToQuestions(result);
    addSelectedToQuestionSet(result);

    return new ServiceResponse(
        200,
        {questionnaire : questionnaire, questions: result},
        'Successfully registered questionnaire service'
    );
});

export const createQuestionnaire = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']?.id;
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }
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
            withDatabaseOperation((client) => markQuestionnaireFinished(client, userId)),
            thirtyMinutesInMs
        );
    }
    const result = await getQuestionnaireQuestions(client, questionnaireObj['id']);
    adjustQuestionnaireOutputAnswerSets(result);
    addImageToQuestions(result);
    addSelectedToQuestionSet(result);

    return new ServiceResponse(
        200,
        {questions: result, questionnaire: questionnaireObj},
        'Successfully created questionnaire'
    );
});

export const submitQuestionnaireSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']?.id;
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }
    const questionId = params['path']?.qId;
    if (!isStringValidInteger(questionId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    const questionIdInteger = parseInt(questionId, 10);
    const userIdInteger = parseInt(userId, 10);
    if ((userIdInteger - 1) * 26 >= questionIdInteger || questionIdInteger > userIdInteger * 26) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.QUESTION_ID_NOT_IN_QUESTIONNAIRE}, 'Invalid question id');
    }

    const answers = params['body'];
    const answerInputValidation = validateAnswerSetInput(answers);
    if (answerInputValidation) {
        return answerInputValidation;
    }
    const bitset = calculateBitsetOfAnswers(answers);
    const correctAnswers = adjustOutputAnswerSet((await client.query(
        `select 
            answer_id as "id",
            correct
        from submit_questionnaire_solution($1::int, $2::int, $3::int)`,
        [userId, questionId, bitset]
    )).rows);

    if (correctAnswers.length === 0) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.QUESTION_SOLUTION_ALREADY_SUBMITTED}, 'Already submitted');
    }

    const correctBitset = calculateBitsetOfAnswers(correctAnswers, 'correct');

    return new ServiceResponse(
        200, 
        {isCorrect: correctBitset === bitset, correctAnswers: correctAnswers}, 
        'Successfully submitted questionnaire question'
    );
});

export const finishQuestionnaire = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['path']?.id;
    const validationResult = validateAuth(params['authorization'], userId);
    if (validationResult) {
        return validationResult;
    }
    markQuestionnaireFinished(client, userId);
    const result = (await client.query(
        `SELECT 
            gq.id,
            gq.sent,
            gq.solved,
            gq.selected_fields as "selectedFields",
            q.text,
            q.image_id as "imageId",
            ARRAY_AGG(
                JSONB_BUILD_OBJECT(
                    'id', a.id,
                    'description', a.description,
                    'correct', a.correct
                ) 
            ) AS answers
        FROM 
            generated_question gq
        JOIN 
            answer a ON gq.question_id = a.question_id
        JOIN
            question q on gq.question_id = q.id
        where 
            gq.questionnaire_id = $1::int
        GROUP BY 
            gq.id, q.text, q.image_id
        order by gq.id;`,
        [userId]
    )).rows;
    adjustQuestionnaireOutputAnswerSets(result);
    addImageToQuestions(result);
    const count = parseInt((await client.query(
        `select count(' ') filter (where q.solved) as cnt
            from generated_question q  
            where q.questionnaire_id = $1::int`,
        [userId]
    )).rows[0]['cnt'], 10);
    addSelectedToQuestionSet(result);
    
    return new ServiceResponse(200, {solved: count, questions: result}, 'Successfully finished questionnaire');
});