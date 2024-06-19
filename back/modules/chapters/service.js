import { withDatabaseOperation } from '../_common/db.js';
import { ServiceResponse } from '../_common/serviceResponse.js';
import { ErrorCodes } from '../../common/constants.js';
import { isStringValidInteger } from '../../common/utils.js';

export const getAllChapters = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    _params
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
    client,
    _req,
    _res,
    params
) {
    const id = params['path']['id'];

    if (!isStringValidInteger(id)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ID },
            'Invalid id format'
        );
    }

    const chapter = (
        await client.query(
            'select number, title, content, isAddendum from chapter where id=$1::int',
            [id]
        )
    ).rows;
    if (chapter.length === 0) {
        return new ServiceResponse(
            404,
            { errorCode: ErrorCodes.CHAPTER_NOT_FOUND },
            'No chapter with given id'
        );
    }
    return new ServiceResponse(
        200,
        chapter[0],
        'Chapter content retrieved successfully'
    );
});
