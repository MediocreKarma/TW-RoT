import {
    getAllChaptersService,
    getChapterContentService,
} from '../services/chapterServices.js';
import { sendJsonResponse } from '../response.js';

export async function getAllChapters(req, res) {
    const serviceResponse = await getAllChaptersService();
    sendJsonResponse(
        res,
        serviceResponse.status,
        serviceResponse.body,
        serviceResponse.message
    );
}

export async function getChapterContent(req, res, pathParams) {
    const serviceResponse = await getChapterContentService(pathParams.id);
    sendJsonResponse(
        res,
        serviceResponse.status,
        serviceResponse.body,
        serviceResponse.message
    );
}
