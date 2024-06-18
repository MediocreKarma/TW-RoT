import { withDatabaseOperation } from '../_common/db.js';
import { ServiceResponse } from '../_common/serviceResponse.js';

export const getAllChapters = withDatabaseOperation(async function (
    client, _req, _res, _params
) {
    const chapters = (
        await client.query('select id, number, title, isAddendum from chapter')
    ).rows;
    return new ServiceResponse(
        200,
        chapters,
        'Chapters retrieved successfully'
    );
});

export const getChapterContent = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const id = params['path']['id'];
    const chapter = (
        await client.query(
            'select number, title, content, isAddendum from chapter where id=$1::int',
            [id]
        )
    ).rows[0];
    return new ServiceResponse(
        200,
        chapter,
        'Chapter content retrieved successfully'
    );
});
