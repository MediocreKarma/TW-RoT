import { sendJsonResponse } from "../../common/response.js";

export class ServiceResponse {
    constructor(status, body, message = '') {
        this.status = status;
        this.body = body;
        this.message = message;
    }
}

export function withResponse(serviceFunction) {
    return async function(req, res, params) {
        try {
            const serviceResponse = await serviceFunction(req, res, params);
            sendJsonResponse(
                res,
                serviceResponse.status,
                serviceResponse.body,
                serviceResponse.message
            );
        } catch (error) {
            sendJsonResponse(
                res,
                500,
                null,
                error.message || 'Internal Server Error'
            );
        }
    };
}