import {getAllChaptersService} from "../services/chapterServices.js";
import {sendJsonResponse} from "../response.js";

export async function getAllChapters(req, res) {
    const serviceResponse = await getAllChaptersService();
    res.message = serviceResponse.message;
    sendJsonResponse(res, serviceResponse.status, JSON.stringify(serviceResponse.body));
}
