import { withDatabaseOperation } from '../_common/db.js';
import { CSVResponse, ServiceResponse } from '../_common/serviceResponse.js';
import { ErrorCodes } from '../../common/constants.js';
import { isStringValidInteger, isAdmin, parseCSV } from '../../common/utils.js';
import { buildCSVFromPGResult } from '../_common/utils.js';
import { validateAuth } from "../_common/utils.js";

/**
 * Handler function to get all Traffic Code Chapters
 */
export const getAllChapters = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    if (params['query'].output === 'csv') {
        return new CSVResponse(
            buildCSVFromPGResult(await client.query(`select * from chapter`)), 
            'Successfully retrieved chapters csv'
        );
    }
    if (params['query'].output === 'json') {
        return new ServiceResponse(200, (await client.query('select * from chapter')).rows,  'Successfully retrieved chapters json')
    }

    const chapters = (
        await client.query('select id, number, title, isaddendum from chapter order by id')
    ).rows;
    return new ServiceResponse(
        200,
        chapters,
        'Chapters retrieved successfully'
    );
});

/**
 * Handler function to retrieve the content of one chapter, by id
 */
export const getChapterContent = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    const id = params['path']?.id;

    if (!isStringValidInteger(id)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ID },
            'Invalid id format'
        );
    }

    if (params['query'].output === 'csv') {
        return new CSVResponse(
            buildCSVFromPGResult(await client.query(`select * from chapter where id = $1`, [id])), 
            'Successfully retrieved chapters csv'
        );
    }

    const chapter = (
        await client.query(
            'select number, title, content, isaddendum from chapter where id=$1::int',
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

const validateChapter = (chapter) => {

    const title = chapter?.title;
    const content = chapter?.content;
    const addendum = chapter?.isaddendum;
    const number = chapter?.number;

    if (title === undefined) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_TITLE_NOT_IN_BODY },
            'Chapter title not in body'
        );
    }

    if (title === null) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_TITLE },
            'Chapter title invalid'
        );
    }

    if (title?.length > 128) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_TITLE_TOO_LONG },
            'Chapter title too long'
        );
    }

    if (title?.length > 128) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_TITLE_TOO_LONG },
            'Chapter title too long'
        );
    }

    if (content === undefined) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_CONTENT_NOT_IN_BODY },
            'Chapter content not in body'
        );
    }
    
    if (content === null) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_CONTENT },
            'Chapter content invalid'
        );
    }

    if (content?.length === 0) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_CONTENT_TOO_SHORT },
            'Chapter content too short'
        );
    }

    if (!(addendum === true || addendum === false)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ADDENDUM_STATUS },
            'Invalid chapter addendum status'
        );
    }
        
    if (number === undefined) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_NUMBER_NOT_IN_BODY },
            'Chapter number not in body'
        );
    }   

    if (!Number.isInteger(number)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_NUMBER },
            'Invalid chapter number'
        );
    }
}

const addNewChapter = async (client, chapter) => {
    const validation = validateChapter(chapter);
    if (validation) {
        return validation;
    }
    const id = (
        await client.query(
            'insert into chapter values(default, $1::int, $2::varchar, $3::text, $4::bool) returning id',
            [chapter.number, chapter.title, chapter.content, chapter.isaddendum],
        )
    ).rows[0]['id'];

    const newChapter = (
        await client.query(
            'select id, number, title, content, isaddendum from chapter where id=$1::int',
            [id]
        )
    ).rows;
    
    return new ServiceResponse(
        200,
        newChapter[0],
        'Chapter added successfully'
    );
}

export const postChapter = withDatabaseOperation(async function(client,
    _req,
    _res,
    params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    if (params.body?.files?.csv) {
        const data = await parseCSV(params.body.files.csv.filepath);
        for (const chapter of data) {
            chapter.isaddendum = chapter.isaddendum === 'true' ? true : false;
            const result = await addNewChapter(client, chapter);
            if (result.status < 200 || 299 < result.status) {
                return result;
            }
        }
        return new ServiceResponse(204, null, 'Successfully added chapters');
    }
    else if (Array.isArray(params.body)) {
        for (const chapter of params.body) {            
            const result = await addNewChapter(client, chapter);
            if (result.status < 200 || 299 < result.status) {
                return result;
            }
        }
        return new ServiceResponse(204, null, 'Successfully added chapters');
    }
    else {
        return await addNewChapter(client, params.body);
    }
})


export const patchChapter = withDatabaseOperation(async function(client,
    _req,
    _res,
    params
) {    
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    const id = params['path']?.id;

    if (!isStringValidInteger(id)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ID },
            'Invalid id format'
        );
    }

    let originalChapter = (
        await client.query(
            'select number, title, content, isaddendum from chapter where id=$1::int',
            [id]
        )
    ).rows;
    if (originalChapter.length === 0) {
        return new ServiceResponse(
            404,
            { errorCode: ErrorCodes.CHAPTER_NOT_FOUND },
            'No chapter with given id'
        );
    }

    originalChapter = originalChapter[0];

    const chapter = params['body'];

    const title = chapter?.title;
    const content = chapter?.content;
    const addendum = chapter?.isaddendum;
    const number = chapter?.number;

    if (title !== undefined && title?.length > 128) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_TITLE_TOO_LONG },
            'Chapter title too long'
        );
    }
    if (title !== undefined && title?.length === 0) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_TITLE_TOO_SHORT },
            'Chapter title too short'
        );
    }

    if (content !== undefined && content?.length === 0) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHAPTER_CONTENT_TOO_SHORT },
            'Chapter content too short'
        );
    }

    if (number !== undefined && !Number.isInteger(number)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_NUMBER },
            'Invalid chapter number'
        );
    }

    if (addendum !== undefined && !(addendum === true || addendum === false)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ADDENDUM_STATUS },
            'Invalid chapter addendum status'
        );
    }
    
    if (content === null) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_CONTENT },
            'Chapter content invalid'
        );
    }
    
    if (title === null) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_TITLE },
            'Chapter title invalid'
        );
    }

    const objectWithValueIfExistent = (key, value) => {
        let object = {};
        if (value !== undefined) {
            object[key] = value;
        }
        return object;
    }

    const newChapter = {
        ...originalChapter,
        ...objectWithValueIfExistent('title', chapter.title),
        ...objectWithValueIfExistent('number', chapter.number),
        ...objectWithValueIfExistent('content', chapter.content),
        ...objectWithValueIfExistent('isaddendum', chapter.isaddendum),
    }

    await client.query(
        `update chapter
            set number=$1::int, title=$2::varchar, content=$3::text, isaddendum=$4::bool
            where id=$5::int`,
        [newChapter.number, newChapter.title, newChapter.content, newChapter.isaddendum, id],
    )
    
    return new ServiceResponse(
        204,
        null,
        'Chapter patched successfully'
    );
})

export const deleteChapter = withDatabaseOperation(async function(client,
    _req,
    _res,
    params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    const id = params['path']?.id;

    if (!isStringValidInteger(id)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CHAPTER_ID },
            'Invalid id format'
        );
    }

    const updated = (await client.query(
        `delete from chapter
            where id=$1::int`,
        [id])
    ).rowCount;
    
    if (updated === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.CHAPTER_NOT_FOUND}, `Could not delete nonexistent chapter`);
    }
    
    return new ServiceResponse(
        204,
        null,
        'Chapter deleted successfully'
    );
})