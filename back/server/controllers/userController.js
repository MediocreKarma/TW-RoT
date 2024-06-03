import {addQuestionSolutionService} from "../services/userService.js";
import {sendJsonResponse} from "../response.js";

export async function addQuestionSolution(req, res, params) {
    const serviceResponse = await addQuestionSolutionService(params);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}