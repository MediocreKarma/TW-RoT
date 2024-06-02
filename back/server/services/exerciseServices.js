import {withDatabaseOperation} from "../db.js";
import {ServiceResponse} from "../models/serviceResponse.js";

export const getAllCategories = withDatabaseOperation(async function (client, user_id = 0) {
    const qcData = (await client.query(
        'select ' +
        '       qc.title as title, ' +
        '       qc.id as id, ' +
        '       count(q.id) filter (where aq.answered_correctly) as solved_questions, ' +
        '       count(q.id) filter (where not aq.answered_correctly) as wrong_questions, ' +
        '       count(q.id) as total_questions \n' +
        '    from question_category qc\n' +
        '    left join question q\n' +
        '        on q.category_id = qc.id\n' +
        '    left join answered_question aq\n' +
        '        on aq.question_id = q.id and aq.user_id = $1::int\n' +
        '    group by qc.id, qc.title\n' +
        '    order by qc.id;',
        [user_id]
    )).rows;

    const {solved, total, wrong} = qcData.reduce((acc, category) => {
        acc.solved += parseInt(category['solved_questions'], 10) ?? 0;
        acc.total += parseInt(category['total_questions'], 10) ?? 0;
        acc.wrong += parseInt(category['wrong_questions'], 10) ?? 0;
        console.log(category);
        return acc;
    }, {solved: 0, total: 0, wrong: 0});

    return new ServiceResponse(
        200,
        {solved: solved, wrong: wrong, total: total, categories: qcData},
        'Question category content retrieved successfully'
    );
});

const SQL_SELECT_STATEMENT =
    'select ' +
    '       q.id as question_id, ' +
    '        q.category_id as category_id, ' +
    '        q.text as question_text, ' +
    '        q.image_id as question_image, ' +
    '        a.id as answer_id, ' +
    '        a.description as answer_description ' +
    '    from question q join answer a on q.id = a.question_id\n';

function parseQuestionData(qData) {
    const questionObj = {
        id: qData[0]['question_id'],
        category: qData[0]['category_id'],
        text: qData[0]['question_text'],
        image: qData[0]['question_image'],
    };

    const answerObjects = qData.map((qObj) => ({
        id: qObj['answer_id'],
        description: qObj['answer_description']
    }));

    return {question: questionObj, answers: answerObjects}
}

export const getUnsolvedQuestion = withDatabaseOperation(async function (client, user_id, category_id) {
    const qData = (await client.query(
        SQL_SELECT_STATEMENT +
        '    where q.id = (\n' +
        '        select q.id from question q \n' +
        '            left join answered_question aq on q.id = aq.question_id and aq.user_id = $1::int\n' +
        '            where (aq.id is NULL or not aq.answered_correctly) and q.category_id = $2::int\n' +
        '            order by random()\n' +
        '            limit 1\n' +
        '    )\n' +
        '    order by random();',
        [user_id, category_id]
    )).rows;

    if (qData.length === 0) {
        return new ServiceResponse(404, null, 'No unsolved question could be retrieved');
    }

    return new ServiceResponse(
        200,
        parseQuestionData(qData),
        'Successfully retrieved random unsolved question'
    );
});

export const getWrongQuestion = withDatabaseOperation(async function (client, user_id) {
    const qData = (await client.query(
        SQL_SELECT_STATEMENT +
        '    where q.id = (\n' +
        '        select q.id from question q \n' +
        '            join answered_question aq on q.id = aq.question_id and aq.user_id = $1::int\n' +
        '            where not aq.answered_correctly' +
        '            order by random()\n' +
        '            limit 1\n' +
        '    )\n' +
        '    order by random();',
        [user_id],
    )).rows;

    if (qData.length === 0) {
        return new ServiceResponse(404, null, 'No wrongly solved question could be retrieved');
    }

    return new ServiceResponse(
        200,
        parseQuestionData(qData),
        'Successfully retrieved incorrectly solved question'
    );
});

export const getGeneratedQuestionnaire = withDatabaseOperation(async function (client, user_id) {
    const qData = (await client.query()).rows;
})

console.log(JSON.stringify(await getWrongQuestion(1, 1), null, 2));