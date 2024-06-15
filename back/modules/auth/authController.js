import {loginService, registerService} from "./authService.js";
import {sendJsonResponse} from "../../common/response.js";

export async function register(req, res, params) {
    const serverResponse = await registerService(params);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}

export async function login(req, res, params) {
    const serverResponse = await loginService(params);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}