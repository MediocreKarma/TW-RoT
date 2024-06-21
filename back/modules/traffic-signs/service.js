import { ErrorCodes } from '../../common/constants.js';
import { isStringValidInteger } from '../../common/utils.js';
import { withDatabaseOperation } from '../_common/db.js';
import { ImageResponse, ServiceResponse } from '../_common/serviceResponse.js';
import dotenv from 'dotenv';
import fs from 'fs';
dotenv.config({ path: '../../.env' });

const API_IMAGE_URL = `${process.env.TRAFFIC_SIGNS_URL}/api/v1/images/{id}.png`;

const buildImageForObj = (obj) => {
    obj['image'] = API_IMAGE_URL.replace(/{id}/g, obj['imageId']);
    return obj;
};

export const getAllSignCategories = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    _params
) {
    const signCategories = (
        await client.query(
            'select id, title, image_id as "imageId" from sign_category'
        )
    ).rows;
    signCategories.forEach((obj) => buildImageForObj(obj));
    return new ServiceResponse(
        200,
        signCategories,
        'Successfully retrieved sign categories'
    );
});

export const getSignCategory = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    const id = params['path']?.id;
    if (!isStringValidInteger(id)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_SIGN_CATEGORY },
            'Invalid id format'
        );
    }
    const results = (
        await client.query(
            'select id, title, design, purpose, suggestion, image_id as "imageId" from sign_category where id=$1::int',
            [id]
        )
    ).rows;

    if (results.length === 0) {
        return new ServiceResponse(
            404,
            { errorCode: ErrorCodes.SIGN_CATEGORY_NOT_FOUND },
            'No sign category with given id'
        );
    }

    const categoryInfo = buildImageForObj(results[0]);
    const signCategory = (
        await client.query(
            'select s.id, s.title, s.description, s.image_id as "imageId"' +
                'from sign s join sign_to_category_relation stcr on stcr.sign_id = s.id where stcr.category_id = $1::int',
            [id]
        )
    ).rows;
    signCategory.forEach((sign) => buildImageForObj(sign));
    return new ServiceResponse(
        200,
        { category: categoryInfo, signs: signCategory },
        'Successfully retrieved sign category'
    );
});

export const getComparisonCategories = withDatabaseOperation(async function (
    client, _req, _res, _params
) {
    const result = (await client.query(
        'select id, title from comparison_category'
    )).rows;

    return new ServiceResponse(200, result, 'Successfully retrieved comparison categories');
});

export const getComparisonCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const id = params['path']?.ccId;
    if (!isStringValidInteger(id)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_COMPARISON_CATEGORY_ID}, 'Invalid comparison category id');
    }
    const result = (await client.query(
        `select c.id, c.title 
            from comparison c join comparison_sign cs 
                on cs.comparison_id = c.id
            join comparison_category cc 
                on cc.id = c.category_id 
            where cc.id = $1::int
            group by c.id, cc.id, c.title`,
        [id]
    )).rows;
    if (result.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.COMPARISON_CATEGORY_NOT_FOUND}, 'Comparison category not found');
    }
    return new ServiceResponse(200, result, 'Successfully retrieved comparison category');
});

export const getComparison = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const ccId = params['path']?.ccId;
    if (!isStringValidInteger(ccId)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_COMPARISON_CATEGORY_ID}, 'Invalid comparison category id');
    }
    const id = params['path']?.cId;
    if (!isStringValidInteger(id)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_COMPARISON_ID}, 'Invalid comparison id');
    }
    const result = (await client.query(
        `select cs.id, cs.country, cs.image_id as "imageId"
            from comparison c join comparison_sign cs 
                on cs.comparison_id = c.id
            join comparison_category cc 
                on cc.id = c.category_id where c.id = $1::int and cc.id = $2::int`,
        [id, ccId]
    )).rows;
    if (result.length === 0) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.COMPARISON_NOT_FOUND}, 'Comparison not found');
    }
    result.forEach(sign => buildImageForObj(sign));
    return new ServiceResponse(200, result, 'Successfully retrieved comparison category');
});
