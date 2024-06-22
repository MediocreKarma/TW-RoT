import { ErrorCodes } from '../../common/constants.js';
import { isStringValidInteger } from '../../common/utils.js';
import { withDatabaseOperation } from '../_common/db.js';
import { ServiceResponse } from '../_common/serviceResponse.js';

const API_IMAGE_URL = `${process.env.EXERCISES_URL}/api/v1/images/{id}.png`;

export const SQL_SELECT_STATEMENT =
    `select
        q.id as "id",
        q.category_id as "categoryId",
        qc.title as "categoryTitle",
        q.text as "text",
        q.image_id as "imageId",
        array_agg(jsonb_build_object('id', a.id, 'description', a.description) order by random()) as "answers"
    from 
        question q 
        join answer a on q.id = a.question_id 
        join question_category qc on qc.id = q.category_id`;

export const SQL_GROUPING_STATEMENT =
    `group by
        q.id, q.category_id, qc.title, q.text, q.image_id`;


export const getAllExerciseCategories = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['authorization']?.user?.id ?? 0;
    const qcData = (await client.query(
        'select ' +
            '   qc.title as title, ' +
            '   qc.id as id, ' +
            '   count(q.id) filter (where aq.answered_correctly and not q.deleted) as "solved", ' +
            '   count(q.id) filter (where not aq.answered_correctly and not q.deleted) as "wrong", ' +
            '   count(q.id) filter (where not q.deleted) as "total" \n' +
            'from question_category qc\n' +
            'left join question q\n' +
            '    on q.category_id = qc.id\n' +
            'left join answered_question aq\n' +
            '    on aq.question_id = q.id and aq.user_id = $1::int\n' +
            '    where not q.deleted\n' +
            'group by qc.id, qc.title\n' +
            'order by qc.id;',
        [userId]
    )).rows;

    const { solved, total, wrong } = qcData.reduce(
        (acc, category) => {
            // why are these not ints by default, weird
            category['solved'] = parseInt(category['solved'], 10);
            acc.solved += category['solved'];
            category['total'] = parseInt(category['total'], 10);
            acc.total += category['total'];
            category['wrong'] = parseInt(category['wrong'], 10);
            acc.wrong += category['wrong'];
            return acc;
        },
        { solved: 0, total: 0, wrong: 0 }
    );

    return new ServiceResponse(
        200,
        { solved: solved, wrong: wrong, total: total, categories: qcData },
        'Question category content retrieved successfully'
    );
});

export const addImageToQuestion = (question) => {
    question?.imageId
    ? question['image'] = API_IMAGE_URL.replace(/{id}/g, question.imageId)
    : delete question.imageId;
    return question;
}

export const adjustOutputAnswerSet = (answers) => {
    let minAnswerId = Number.MAX_SAFE_INTEGER;
    for (const answer of answers) {
        minAnswerId = Math.min(minAnswerId, answer['id']);
    }
    answers.forEach((ans) => ans['id'] -= (minAnswerId - 1));
    return answers;
}

export const getUnsolvedQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) { 
    const userId = params['authorization']?.user?.id ?? 0;
    const qData = (await client.query(
        `${SQL_SELECT_STATEMENT}
            where 
                q.id = (
                    select 
                        q.id
                    from 
                        question q
                        left join answered_question aq on q.id = aq.question_id and aq.user_id = $1::int
                    where
                        (aq.id is NULL or not aq.answered_correctly) and not q.deleted
                    order by 
                        random()
                    limit 
                        1
                )
            ${SQL_GROUPING_STATEMENT}`,
        [userId]
    )).rows;

    if (qData.length === 0) {
        return new ServiceResponse(
            404,
            {errorCode: ErrorCodes.NO_MORE_QUESTIONS_FOR_CATEGORY},
            'No unsolved question could be retrieved'
        );
    }
    addImageToQuestion(qData[0]);
    adjustOutputAnswerSet(qData[0].answers);
    return new ServiceResponse(
        200,
        qData[0],
        'Successfully retrieved random unsolved question'
    );
})

export const getUnsolvedQuestionByCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const categoryId = params['path']['id'];
    if (!isStringValidInteger(categoryId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_CATEGORY_ID}, 'Invalid question category id');
    }
    const userId = params['authorization']?.user?.id ?? 0;
    const qData = (
        await client.query(
            `${SQL_SELECT_STATEMENT}
                where 
                    q.id = (
                        select 
                            q.id 
                        from 
                            question q 
                            left join answered_question aq on q.id = aq.question_id and aq.user_id = $1::int
                        where 
                            (aq.id is NULL or not aq.answered_correctly) and q.category_id = $2::int and not q.deleted
                        order by 
                            random()
                        limit 
                            1
                    )
                ${SQL_GROUPING_STATEMENT}`,
            [userId, categoryId]
        )
    ).rows;

    if (qData.length === 0) {
        return new ServiceResponse(
            404,
            {errorCode: ErrorCodes.NO_MORE_QUESTIONS_FOR_CATEGORY},
            'No unsolved question could be retrieved'
        );
    }
    addImageToQuestion(qData[0]);
    adjustOutputAnswerSet(qData[0].answers);
    return new ServiceResponse(
        200,
        qData[0],
        'Successfully retrieved random unsolved question'
    );
});

export const getIncorrectlySolvedQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['authorization']?.user?.id;
    if (!userId) {
        return new ServiceResponse(401, {errorCode: ErrorCodes.UNAUTHENTICATED}, 'Cannot retrieve incorrectly solved for unlogged user');
    }
    const qData = (
        await client.query(
            `${SQL_SELECT_STATEMENT}
                where 
                    q.id = (
                        select 
                            q.id 
                        from 
                            question q 
                            left join answered_question aq on q.id = aq.question_id and aq.user_id = $1::int
                        where 
                            not aq.answered_correctly and not q.deleted
                        order by 
                            random()
                        limit 
                            1
                    )
                ${SQL_GROUPING_STATEMENT}`,
                [userId]
            )
    ).rows;

    if (qData.length === 0) {
        return new ServiceResponse(
            404,
            {errorCode: ErrorCodes.NO_MORE_INCORRECTLY_SOLVED_QUESTIONS},
            'No wrongly solved question could be retrieved'
        );
    }
    addImageToQuestion(qData[0]);
    adjustOutputAnswerSet(qData[0].answers);
    return new ServiceResponse(
        200,
        qData[0],
        'Successfully retrieved incorrectly solved question'
    );
});

export const getSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const questionId = params['path']?.id;
    if (!isStringValidInteger(questionId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_QUESTION_ID}, 'Invalid question id');
    }
    const results = (await client.query(
        'select \n' +
        '        a.id as "id", \n' +
        '        a.correct as "correct"\n' +
        '    from answer a \n' +
        '    join question q\n' +
        '        on a.question_id = q.id\n' +
        '        where q.id = $1::int and not q.deleted',
        [questionId]
    )).rows;

    if (results.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.QUESTION_NOT_FOUND}, 'Question not found');
    }
    adjustOutputAnswerSet(results);
    return new ServiceResponse(200, results, 'Successfully retrieved question answers');
});

