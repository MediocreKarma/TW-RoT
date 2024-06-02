import {getAllExerciseCategoriesService} from "../services/exerciseServices.js";
import {sendJsonResponse} from "../response.js";

export async function getAllExerciseCategories(req, res, params) {
    const serverResponse = await getAllExerciseCategoriesService(params.authorization ?? 0);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}