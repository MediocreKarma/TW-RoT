import {withDatabaseOperation} from "../db";
import {ServiceResponse} from "../models/serviceResponse.js";

export const getAllChapters = withDatabaseOperation(async function (client) {
    const chapters = await client.query('select id, number, title from chapter').rows;
    return new ServiceResponse(200, chapters, 'Chapters retrieved successfully');
});

export const getChapterContent = withDatabaseOperation(async function (client, id) {
    const chapter = await client.query(
        'select number, title, content from chapter where id=$1::int', [id]
    ).rows;
    return new ServiceResponse(200, chapter, 'Chapter content retrieved successfully');
});