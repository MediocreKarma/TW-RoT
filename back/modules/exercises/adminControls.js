import { ErrorCodes } from "../../common/constants.js";
import { isAdmin, isStringValidInteger } from "../../common/utils.js";
import { withDatabaseOperation, withDatabaseTransaction } from "../_common/db.js"
import { ServiceResponse } from "../_common/serviceResponse.js";
import { validateAuth, validateStartAndCountParams } from "../_common/utils.js";
import { validateAnswerSetInput } from "./questionnaire.js";
import { SQL_SELECT_STATEMENT, SQL_GROUPING_STATEMENT, adjustOutputAnswerSet, addImageToQuestion } from "./service.js";
import Jimp from "jimp";
import { v4 as uuid4 } from 'uuid';

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

const validateInfoQuestion = (question, validateText = true) => {
    if (!question) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.QUESTION_BODY_NOT_FOUND}, 'Missing question body');
    }
    if (!question.categoryId && !question.categoryTitle) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.MISSING_CATEGORY_FROM_QUESTION}, 'Missing Category Id|Title from question');
    }
    if (question.categoryId && question.categoryTitle) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.CATEGORY_ID_AND_CATEGORY_TITLE_GIVEN}, `Category id and title supplied, can't choose one`);
    }
    if (!question.categoryTitle && !Number.isInteger(question.categoryId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_CATEGORY_ID}, 'Invalid category id');
    }
    if (validateText && !question.text) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.MISSING_TEXT_FROM_QUESTION}, 'Missing text from question');
    }
}

const prepImage = async (question) => {
    if (!question.image) {
        return {image: null, imageId: null};
    }
    const buffer = Buffer.from(question.image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
    const image = await Jimp.read(buffer);
    const imageId = uuid4();
    question.imageId = imageId;
    addImageToQuestion(question);
    return {image: image, imageId: imageId};
}

const handleCategory = async (client, question, update = false) => {
    if (question.categoryId) {
        const categoryTitles = (await client.query(
            `select title from question_category where id = $1::int`,
            [question.categoryId]
        )).rows;

        if (categoryTitles.length === 0) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_CATEGORY_NOT_FOUND}, 'Question category not found');
        }
        question.categoryTitle = categoryTitles[0].title;
    }
    else {
        const existsCategory = parseInt(await client.query(
            `select count(' ') from question_category where title = $1::varchar`,
            [question.categoryTitle]
        ));
        if (existsCategory) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.CATEGORY_ALREADY_EXISTS}, 'Question category already exists');
        }

        question.categoryId = (await client.query(
            `insert into question_category (title) values ($1::varchar) returning id`,
            [question.categoryTitle]
        )).rows[0].id;
    }
}

const validateQuestion = async (client, question, update = false) => {
    const qstInfoValidation = validateInfoQuestion(question);
    if (qstInfoValidation) {
        return qstInfoValidation;
    }
    const answerInputValidation = validateAnswerSetInput(question.answers, 'correct', true, false);
    if (answerInputValidation) {
        return answerInputValidation;
    }
    if (question.answers.length <= 1) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.TOO_FEW_ANSWER_OPTIONS}, 'Too few answer options');
    }
    const categoryValidation = await handleCategory(client, question, update);
    if (categoryValidation) {
        return categoryValidation;
    }
}

export const addQuestion = withDatabaseTransaction(async function (
    client, _req, _res, params
) {
    const question = params['body'];
    const validation = validateQuestion(client, question);
    if (validation instanceof ServiceResponse) {
        return validation;
    }

    const {image, imageId} = await prepImage(question);

    question.id = (await client.query(
        `insert into question (category_id, text, image_id) values ($1::int, $2::varchar, $3::text) returning id`,
        [question.categoryId, question.text, imageId]
    )).rows[0].id;

    let answerData = [question.id, question.answers[0].description, question.answers[0].correct];
    const insertValue = `, ($1::int, $x::varchar, $y::boolean)`;
    let insertStatement = '($1::int, $2::varchar, $3::boolean)';
    for (let i = 1; i < question.answers.length; ++i) {
        insertStatement = insertStatement + insertValue.replace('x', i * 2 + 2).replace('y', i * 2 + 3);
        answerData.push(question.answers[i].description, question.answers[i].correct);
    }

    const answerIds = (await client.query(
        `insert into answer (question_id, description, correct) values
            ${insertStatement} returning id`,
        answerData
    )).rows;

    for (let i = 0; i < question.answers.length; ++i) {
        question.answers[i].id = answerIds[i].id;
    }

    if (imageId) {
        await image.writeAsync(`./images/${imageId}.png`);
    }

    return new ServiceResponse(201, question, 'Successfully created question');
});

export const updateQuestion = withDatabaseTransaction(async function(
    client, _req, _res, params
) {
    const qId = params['path']?.id;
    if (!isStringValidInteger(qId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    const originalRows = (await client.query(
        `${SQL_SELECT_STATEMENT} where q.id = $1::int ${SQL_GROUPING_STATEMENT}`
    )).rows;
    if (originalRows.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_NOT_FOUND}, 'No such question');
    }
    const original = originalRows[0];
    const question = params['body'];
    const validation = validateQuestion(client, question, true);
    if (validation instanceof ServiceResponse) {
        return validation;
    }
    let {image, imageId} = {image: question.image, imageId: question.imageId};
    let isNew = false;
    if (!question.imageId) {
        ({image, imageId} = await prepImage(question));
        isNew = true;
    }
    await client.query(
        `update question 
            set 
                category_id = $1::int,
                text = $2::varchar,
                image_id = $3::varchar
            where
                id = $4::int`,
        [question.categoryId, question.text, imageId, qId]
    );

    // TODO: DIFFERENT LENGTH ANSWER SETS | MIGHT JUST DO A SIMPLE LOOP

    question.answers.sort((a, b) => a.id - b.id);
    original.answers.sort((a, b) => a.id - b.id);

    

});

export const deleteQuestion = withDatabaseTransaction(async function (
    client, _req, _res, params
) {

});