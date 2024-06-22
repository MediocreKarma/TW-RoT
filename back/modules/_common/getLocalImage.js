import fs from 'fs';
import { ServiceResponse, ImageResponse } from './serviceResponse.js';

/**
 * utility function that gets an image from the local ./images folder
 * for a given pathname delivered in the params object
 * 
 * @param {*} _req not required
 * @param {*} _res not required
 * @param {*} params the params object of a given request
 * @returns on error a ServiceResponse and on succes the ImageResponse 
 */
export const getImage = async function (_req, _res, params) {
    const filename = params['path']['name'];
    if (!filename) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_IMAGE_ID },
            'Image id is invalid'
        );
    }
    const path = `./images/${filename}`;
    if (!fs.existsSync(path)) {
        return new ServiceResponse(
            404,
            { errorCode: ErrorCodes.TRAFFIC_SIGNS_IMAGE_NOT_FOUND },
            'Image does not exist'
        );
    }
    return new ImageResponse(200, path, 'Successfully retrieved image');
};