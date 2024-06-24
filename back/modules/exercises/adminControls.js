import { ErrorCodes } from "../../common/constants.js";
import { isAdmin, isStringValidInteger, parseCSV, zip } from "../../common/utils.js";
import { withDatabaseOperation, withDatabaseTransaction } from "../_common/db.js"
import { CSVResponse, ServiceResponse } from "../_common/serviceResponse.js";
import { validateAuth, validateStartAndCountParams } from "../_common/utils.js";
import { buildCSVFromPGResult } from "../_common/utils.js";
import { validateAnswerSetInput } from "./questionnaire.js";
import { SQL_SELECT_STATEMENT, SQL_GROUPING_STATEMENT, adjustOutputAnswerSet, addImageToQuestion } from "./service.js";
import Jimp from "jimp";
import { v4 as uuid4 } from 'uuid';

/**
 * Default sql fetch statement for questions
 */
const SQL_WHERE_FETCH_STATEMENT = 
    `WHERE 
        (q.text LIKE '%' || $1::varchar || '%' 
        OR qc.title LIKE '%' || $1::varchar || '%' 
        OR a.description LIKE '%' || $1::varchar || '%') and not q.deleted `;

/**
 * Admin handler, fetches question in paginated manner.
 * Accepts a query parameter. If integer, the fetcher will
 * return only the question matching the id. Otherwise, will
 * attempt to match the query string to all related questions
 */
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

    if (params['query'].output === 'csv') {
        const result = await client.query(
            `${SQL_SELECT_STATEMENT} ${SQL_GROUPING_STATEMENT}`
        );
        return new CSVResponse(buildCSVFromPGResult(result), 'Successfully retrieved question CSV');
    }

    const start = params['query']?.start ?? '0';
    const count = params['query']?.count ?? '5';
    const startAndCountValidation = validateStartAndCountParams(start, count);
    if (startAndCountValidation instanceof ServiceResponse) {
        return startAndCountValidation;
    }

    const query = params['query']?.query ?? '';

    const data = (await client.query(
        `${SQL_SELECT_STATEMENT} ${SQL_WHERE_FETCH_STATEMENT} ${SQL_GROUPING_STATEMENT}
            offset $2::int limit $3::int`,
        [query, start, count]
    )).rows;

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

    data.sort((a, b) => a.id - b.id);

    const answerData = (await client.query(
        `select array_agg(jsonb_build_object('id', a.id, 'description', a.description, 'correct', a.correct) order by a.id) as "answers"
            from answer a where a.question_id = any($1::int[]) group by a.question_id order by a.question_id`,
        [data.map(q => q.id)]
    )).rows;

    for (const [q, answerSet] of zip(data, answerData)) {
        q.answers = answerSet.answers;
        q.answers.sort((a, b) => a.id - b.id); 
        adjustOutputAnswerSet(q.answers);
        addImageToQuestion(q);
    }

    return new ServiceResponse(200, {total: cnt, data: data}, 'Successfully fetched questions');
})

export const fetchQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const validation = validateAuth(params['authorization']);
    if (validation instanceof ServiceResponse) {
        return validation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    const qId = params['path']['id'];
    if (!isStringValidInteger(qId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    console.log(`${SQL_SELECT_STATEMENT} where not q.deleted and q.id = $1::int ${SQL_GROUPING_STATEMENT}`)
    const res = (await client.query(
        `${SQL_SELECT_STATEMENT} where not q.deleted and q.id = $1::int ${SQL_GROUPING_STATEMENT}`,
        [qId]
    )).rows;

    console.log(res);

    if (res.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_ID_NOT_FOUND}, 'No question found');
    }

    const question = res[0];
    question.answers.sort((a, b) => a.id - b.id); 
    adjustOutputAnswerSet(question.answers);
    addImageToQuestion(question);
    return new ServiceResponse(200, question, 'Successfully retrieved question');
});

const validateInfoQuestion = (question, validateText = true) => {
    if (!question) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.QUESTION_BODY_NOT_FOUND}, 'Missing question body');
    }
    if (!question.categoryId && !question.categoryTitle) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.MISSING_CATEGORY_FROM_QUESTION}, 'Missing Category Id|Title from question');
    }
    if (!question.categoryTitle && !Number.isInteger(question.categoryId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_CATEGORY_ID}, 'Invalid category id');
    }
    if (question.categoryTitle && question.categoryTitle >= 256) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.CATEGORY_TITLE_TOO_LONG}, 'Category title too long');
    }
    if (validateText && !question.text) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.MISSING_TEXT_FROM_QUESTION}, 'Missing text from question');
    }
    if (validateText && question.description >= 4096) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.DESCRIPTION_TOO_LONG}, 'Description too long');
    }
}

const prepImage = async (question) => {
    if (question.imageInfo) {
        try {
            const image = await Jimp.read(question.imageInfo.filepath);
            const imageId = uuid4();
            question.imageId = imageId;
            addImageToQuestion(question);
            delete question.imageInfo;
            return {image: image, imageId: imageId};
        } catch (err) {
            delete question.image;
            return {image: null, imageId: null};
        }
    }
    if (!question.image) {
        return {image: null, imageId: null};
    }
    try {
        const buffer = Buffer.from(question.image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        const image = await Jimp.read(buffer);
        const imageId = uuid4();
        question.imageId = imageId;
        addImageToQuestion(question);
        return {image: image, imageId: imageId};
    }
    catch (err) {
        delete question.image;
        return {image: null, imageId: null};
    }
}

const handleCategory = async (client, question) => {
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
        const existsCategory = (await client.query(
            `select count(' ')::int as cnt from question_category where title = $1::varchar`,
            [question.categoryTitle]
        )).rows[0]['cnt'];
        if (existsCategory) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.CATEGORY_ALREADY_EXISTS}, 'Question category already exists');
        }

        question.categoryId = (await client.query(
            `insert into question_category (title) values ($1::varchar) returning id`,
            [question.categoryTitle]
        )).rows[0].id;
    }
}

const validateQuestion = async (client, question) => {
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
    const categoryValidation = await handleCategory(client, question);
    if (categoryValidation) {
        return categoryValidation;
    }
}

const writeQuestion = async function(client, question, image = null, imageId = null) {
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
}

export const addQuestion = async function (client, question) {
    const validation = await validateQuestion(client, question);
    if (validation instanceof ServiceResponse) {
        return validation;
    }

    const {image, imageId} = await prepImage(question);

    question.id = (await client.query(
        `insert into question (category_id, text, image_id) values ($1::int, $2::varchar, $3::text) returning id`,
        [question.categoryId, question.text, imageId]
    )).rows[0].id;

    return await writeQuestion(client, question, image, imageId);
}

/**
 * Admin handler for creating a new question.
 * Uploads images if one is provided in the body as a base64 encoding
 */
export const createQuestions = withDatabaseTransaction(async function (
    client, req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    if (req?.headers['content-type']?.includes('multipart/form-data')) {
        try {
            if (params['body']?.fields?.question) {
                const question = JSON.parse(params['body']?.fields?.question);
                question.imageInfo = params['body']?.files?.image;
                return await addQuestion(client, question);
            }
            else if (params['body']?.files?.csv) {
                const questions = await parseCSV(params['body'].files.csv.filepath);
                console.log(questions);
                // for (const question of questions) {
                //     delete question.id;
                //     question.categoryId = parseInt(question.categoryId);
                // }
            }   
        } catch (err) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_FORMAT}, 'Invalid form data submission');
        }
    }
    else {
        if (Array.isArray(params['body'])) {
            for (const qst of params['body']) {
                const result = addQuestion(client, qst);
                if (result.status < 200 || result.status > 299) {
                    return result;
                }
            }
        }
        else {
            return addQuestion(client, params['body']);
        }
    }
});

/**
 * Admin handler for modifying an existing question.
 * Invalidates all related answers to the given question and adds new ones.
 * Removes all related user submissions.
 * Intrusive, prefer POST & DELETE over update
 */
export const updateQuestion = withDatabaseTransaction(async function(
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    const qId = params['path']?.id;
    if (!isStringValidInteger(qId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    const originalRows = (await client.query(
        `${SQL_SELECT_STATEMENT} where q.id = $1::int and not q.deleted ${SQL_GROUPING_STATEMENT}`,
        [qId]
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
    await client.query(
        `delete from answered_question where question_id = $1::int`,
        [qId]
    );
    await client.query(
        `delete from answer where question_id = $1::int`,
        [qId]
    );

    const response = await writeQuestion(client, question, image, imageId);
    response.status = 200;
    response.message = 'Successfully updated question';
    return response;
});

/**
 * Mark a question for deletion that will be removed later.
 * Should not cause issues with existing questionnaires.
 * The question will be removed from the pool of creating new questionnaires
 */
export const deleteQuestion = withDatabaseTransaction(async function (
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation instanceof ServiceResponse) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    const qId = params['path'].id;
    if (!isStringValidInteger(qId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    const affected = (await client.query(
        `update question set deleted = true where id = $1::int`,
        [qId]
    )).rowCount;
    if (affected === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_NOT_FOUND}, 'Question not found');
    }
    await client.query(
        `delete from answered_question where question_id = $1::int`,
        [qId]
    );
    return new ServiceResponse(204, null, 'Successfully deleted question');
});