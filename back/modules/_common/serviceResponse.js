import { sendFileResponse, sendJsonResponse } from "../../common/response.js";
import { ErrorCodes } from "../../common/constants.js";
import fs from 'fs';

export class ServiceResponse {
    constructor(status, body, message = '') {
        this.status = status;
        this.body = body;
        this.message = message;
    }
}

export class ImageResponse {
    constructor(status, filepath, message = '') {
        this.status = status;
        this.filepath = filepath;
        this.file = fs.readFileSync(filepath);
        this.contentType = ImageResponse.getContentType(filepath);
        this.message = message;
    }

    static getContentType(filepath) {
        const extension = filepath.substr(filepath.lastIndexOf('.') + 1);
        switch (extension) {
            case 'jpeg': // intentional
            case 'jpg': return 'image/jpeg';
            case 'png': return 'image/png';
            default: return '';
        }
    }
}

export function withResponse(serviceFunction) {
    return async function(req, res, params) {
        try {
            const response = await serviceFunction(req, res, params);
            if (response instanceof ServiceResponse) {
                sendJsonResponse(
                    res,
                    response.status,
                    response.body,
                    response.message
                );
            }
            if (response instanceof ImageResponse) {
                sendFileResponse(
                    res, 
                    response.status, 
                    response.file, 
                    response.contentType,
                    response.message
                );
            }

        } catch (error) {
            console.log(error.message);
            sendJsonResponse(
                res,
                500,
                {errorCode: ErrorCodes.ServerError},
                'Internal Server Error'
            );
        }
    };
}