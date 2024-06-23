import { ErrorCodes } from '../../common/constants.js';
import { isStringValidInteger } from '../../common/utils.js';
import { withDatabaseOperation } from '../_common/db.js';
import { CSVResponse, ImageResponse, ServiceResponse } from '../_common/serviceResponse.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { buildCSVFromPGResult } from '../_common/utils.js';
dotenv.config({ path: '../../.env' });

const API_IMAGE_URL = `${process.env.TRAFFIC_SIGNS_URL}/api/v1/images/{id}.png`;

const buildImageForObj = (obj) => {
    obj['image'] = API_IMAGE_URL.replace(/{id}/g, obj['imageId']);
    return obj;
};

/**
 * Handler to retrieve information about all sign categories
 */
export const getAllSignCategories = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    if (params['query'].output === 'csv') {
        const csvData = buildCSVFromPGResult(await client.query(
            `select s.id, s.title, s.description, s.image_id as "sign_image", s.category_id, sc.title as "category_title",
                sc.design, sc.purpose, sc.suggestion, sc.image_id as "category_image"
                from sign_category sc join sign s on sc.id = s.category_id`
        ));
        return new CSVResponse(csvData, 'Successfully retrieved sign category csv');
    }

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

/**
 * Handler to get information about one sign category by id
 */
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
            'select id, title, design, purpose, suggestion, image_id as "imageId" from sign_category where id = $1::int',
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
            'select id, title, description, image_id as "imageId"' +
                'from sign s where category_id = $1::int',
            [id]
        )
    ).rows;

    console.log({ category: categoryInfo, signs: signCategory });

    signCategory.forEach((sign) => buildImageForObj(sign));
    return new ServiceResponse(
        200,
        { category: categoryInfo, signs: signCategory },
        'Successfully retrieved sign category'
    );
});

/**
 * Handler to get all available comparison categories
 */
export const getComparisonCategories = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    if (params['query'].output === 'csv') {
        const csvData = buildCSVFromPGResult(await client.query(
            `select cc.id as comparison_category_id, cc.title as comparison_category_title,
                c.id as comparison_id, c.title, cs.image_id, cs.country, cs.id
            from
                comparison_category cc join comparison c on cc.id = c.category_id
                    join comparison_sign cs on c.id = cs.comparison_id`
        ));
        return new CSVResponse(csvData, 'Successfully retrieved comparisons csv');
    }

    const result = (await client.query(
        'select id, title from comparison_category'
    )).rows;

    return new ServiceResponse(200, result, 'Successfully retrieved comparison categories');
});

/**
 * Handler to get all available comparisons for a category
 */
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

/**
 * Handler to retrieve all related information to a category
 */
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
