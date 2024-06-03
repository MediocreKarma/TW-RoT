import {
    addQuestionSolutionService,
    createUserQuestionnaireService
} from "../services/userService.js";
import {sendJsonResponse} from "../response.js";

export async function addQuestionSolution(req, res, params) {
    const serviceResponse = await addQuestionSolutionService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function createQuestionnaire(req, res, params) {
    const serviceResponse = await createUserQuestionnaireService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}