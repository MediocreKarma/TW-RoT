import {
    addQuestionSolutionService,
    createUserQuestionnaireService, getQuestionnaireService, submitQuestionnaireSolutionService
} from "./userService.js";
import {sendJsonResponse} from "../../common/response.js";

export async function addQuestionSolution(req, res, params) {
    const serviceResponse = await addQuestionSolutionService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function getQuestionnaire(req, res, params) {
    const serviceResponse = await getQuestionnaireService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function createQuestionnaire(req, res, params) {
    const serviceResponse = await createUserQuestionnaireService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function submitQuestionnaireSolution(req, res, params) {
    const serviceResponse = await submitQuestionnaireSolutionService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}