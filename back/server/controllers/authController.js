import {registerService} from "../services/authService.js";
import {sendJsonResponse} from "../response.js";

export async function register(req, res, params) {
    const serverResponse = await registerService(params);
    sendJsonResponse(res, serverResponse.status, serverResponse.body, serverResponse.message);
}