import { sendFileResponse, sendJsonResponse } from "../../common/response.js";
import { ErrorCodes } from "../../common/constants.js";
import fs from 'fs';

export class Response {
    constructor(status, body, message = '') {
        this.status = status;
        this.body = body;
        this.message = message;
    }
}

export class ServiceResponse extends Response {
    constructor(status, body, message = '') {
        super(status, body, message);
    }
}

export class ImageResponse extends Response {
    constructor(status, filepath, message = '') {
        super(status, fs.readFileSync(filepath), message);
        this.contentType = ImageResponse.getContentType(filepath);
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

export class CSVResponse extends Response {
    constructor(content, message = '') {
        super(200, content, message);
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
            else if (response instanceof ImageResponse) {
                sendFileResponse(
                    res, 
                    response.status, 
                    response.body, 
                    response.contentType,
                    response.message
                );
            }
            else if (response instanceof CSVResponse) {
                sendFileResponse(
                    res,
                    response.status,
                    response.body,
                    "text/csv",
                    response.message
                )
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