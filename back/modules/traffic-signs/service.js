import { ErrorCodes } from '../../common/constants.js';
import { withDatabaseOperation } from '../_common/db.js';
import { ImageResponse, ServiceResponse } from '../_common/serviceResponse.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({path: '../../.env'});

const API_IMAGE_URL = `${process.env.TRAFFIC_SIGNS_URL}/api/v1/images/{id}.png`;

const buildImageForObj = (obj) => {
    obj['image'] = API_IMAGE_URL.replace(/{id}/g, obj['imageId']);
}

export const getAllSignCategories = withDatabaseOperation(async function (
    client, _req, _res, _params
) {
    const signCategories = (
        await client.query('select id, title, image_id as "imageId" from sign_category')
    ).rows;
    signCategories.forEach((obj) => buildImageForObj(obj));
    return new ServiceResponse(
        200,
        signCategories,
        'Successfully retrieved sign categories'
    );
});

export const getSignCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const id = params['path']['id'];
    const categoryInfo = (
        await client.query(
            'select id, title, design, purpose, suggestion, image_id as "imageId" from sign_category where id=$1::int',
            [id]
        )
    ).rows[0];
    categoryInfo['image'] = API_IMAGE_URL.replace(/{id}/g, categoryInfo['imageId']);
    const signCategory = (
        await client.query(
            'select s.id, s.title, s.description, s.image_id as "imageId"' +
                'from sign s join sign_to_category_relation stcr on stcr.sign_id = s.id where stcr.category_id = $1::int',
            [id]
        )
    ).rows;
    for (const sign of signCategory) {
        sign['image'] = API_IMAGE_URL.replace(/{id}/g, sign['imageId'])
    }
    return new ServiceResponse(
        200,
        { category: categoryInfo, signs: signCategory },
        'Successfully retrieved sign category'
    );
});

export const getSignImage = async function (
    _req, _res, params
) {
    const filename = params['path']['name'];
    if (!filename) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_IMAGE_ID}, 'Image id is invalid');
    }
    const path = `./images/${filename}`;
    if (!fs.existsSync(path)) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.TRAFFIC_SIGNS_IMAGE_NOT_FOUND}, 'Image does not exist');
    }
    return new ImageResponse(200, path, 'Successfully retrieved image');
}
