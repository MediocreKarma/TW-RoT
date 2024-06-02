import {
    getAllExerciseCategoriesService,
    getIncorrectlySolvedQuestionService, getSolutionService,
    getUnsolvedQuestionService,
} from "../services/exerciseServices.js";
import {sendJsonResponse} from "../response.js";

export async function getAllExerciseCategories(req, res, params) {
    const serverResponse = await getAllExerciseCategoriesService(params.authorization ?? 0);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}

export async function getUnsolvedQuestionByCategory(req, res, params) {
    const serverResponse = await getUnsolvedQuestionService(params.id, params.authorization ?? 0);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}

export async function getIncorrectlySolvedQuestion(req, res, params) {
    const serviceResponse = await getIncorrectlySolvedQuestionService(params.authorization ?? 0);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function getSolution(req, res, params) {
    const serviceResponse = await getSolutionService(params.id);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}