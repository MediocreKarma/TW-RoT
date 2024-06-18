import { withDatabaseOperation } from '../_common/db.js';
import { ServiceResponse } from '../_common/serviceResponse.js';

export const getAllExerciseCategories = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['authorization'];
    const qcData = (await client.query(
        'select ' +
            '   qc.title as title, ' +
            '   qc.id as id, ' +
            '   count(q.id) filter (where aq.answered_correctly) as solved_questions, ' +
            '   count(q.id) filter (where not aq.answered_correctly) as wrong_questions, ' +
            '   count(q.id) as total_questions \n' +
            'from question_category qc\n' +
            'left join question q\n' +
            '    on q.category_id = qc.id\n' +
            'left join answered_question aq\n' +
            '    on aq.question_id = q.id and aq.user_id = $1::int\n' +
            'group by qc.id, qc.title\n' +
            'order by qc.id;',
        [userId ?? 0]
    )).rows;

    const { solved, total, wrong } = qcData.reduce(
        (acc, category) => {
            acc.solved += parseInt(category['solved_questions'], 10) ?? 0;
            acc.total += parseInt(category['total_questions'], 10) ?? 0;
            acc.wrong += parseInt(category['wrong_questions'], 10) ?? 0;
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

const SQL_SELECT_STATEMENT =
    `select
        q.id as "questionId",
        q.category_id as "categoryId",
        qg.title as "categoryTitle",
        q.text as "questionText",
        q.image_id as "questionImage",
        array_agg(jsonb_build_object('answerId', a.id, 'description', a.description)) as "answers"
    from 
        question q 
        join answer a on q.id = a.question_id 
        join question_category qg on qg.id = q.category_id`;

const SQL_GROUPING_STATEMENT =
    `group by
        q.id, q.category_id, qg.title, q.text, q.image_id
    order by 
        random();`


function parseQuestionData(qData) {
    const questionObj = {
        id: qData[0]['questionId'],
        category: qData[0]['categoryId'],
        text: qData[0]['questionText'],
        image: qData[0]['questionImage'],
    };

    const answerObjects = qData.map((qObj) => ({
        id: qObj['answer_id'],
        description: qObj['answer_description'],
    }));

    return { question: questionObj, answers: answerObjects };
}

export const getUnsolvedQuestionByCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const categoryId = params['path']['id'];
    const userId = params['authorization'] ?? 0;
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
                            (aq.id is NULL or not aq.answered_correctly) and q.category_id = $2::int
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
            null,
            'No unsolved question could be retrieved'
        );
    }

    return new ServiceResponse(
        200,
        qData[0],
        'Successfully retrieved random unsolved question'
    );
});

export const getIncorrectlySolvedQuestion = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const userId = params['authorization'];
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
                            not aq.answered_correctly
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
            null,
            'No wrongly solved question could be retrieved'
        );
    }

    return new ServiceResponse(
        200,
        qData[0],
        'Successfully retrieved incorrectly solved question'
    );
});

export const getSolution = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const questionId = params['path']['id'];
    const results = (await client.query(
        'select \n' +
        '        a.id as "answerId", \n' +
        '        a.correct as "correct"\n' +
        '    from answer a \n' +
        '    join question q\n' +
        '        on a.question_id = q.id\n' +
        '        where q.id = $1::int;',
        [questionId]
    )).rows;

    return new ServiceResponse(200, results, 'Successfully retrieved question answers');
});
