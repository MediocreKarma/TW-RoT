import { ErrorCodes } from '../../common/constants.js';
import { isAdmin, isStringValidInteger, parseCSV } from '../../common/utils.js';
import { withDatabaseOperation, withDatabaseTransaction } from '../_common/db.js';
import { CSVResponse, ImageResponse, ServiceResponse } from '../_common/serviceResponse.js';
import dotenv from 'dotenv';
import fs from 'fs';
import { buildCSVFromPGResult, validateAuth } from '../_common/utils.js';
import { error } from 'console';
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

const prepImage = async (card) => {
    if (card.imageId) {
        addImageToQuestion(card);
        return {image: null, imageId: null};
    }
    if (card.imageInfo) {
        try {
            const image = await Jimp.read(card.imageInfo.filepath);
            const imageId = uuid4();
            card.imageId = imageId;
            addImageToQuestion(card);
            delete card.imageInfo;
            return {image: image, imageId: imageId};
        } catch (err) {
            delete card.image;
            return {image: null, imageId: null};
        }
    }
    if (!card.image) {
        return {image: null, imageId: null};
    }
    try {
        const buffer = Buffer.from(card.image.replace(/^data:image\/\w+;base64,/, ''), 'base64')
        const image = await Jimp.read(buffer);
        const imageId = uuid4();
        card.imageId = imageId;
        addImageToQuestion(card);
        return {image: image, imageId: imageId};
    }
    catch (err) {
        delete card.image;
        return {image: null, imageId: null};
    }
}

export const addSignCategory = withDatabaseOperation(async function (
    client, req, res, params
) {   
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    const exists = (await client.query(
        `select count(' ')::int as exists from sign_category where $1::varchar = title`,
        [params['body'].title]
    )).rows[0].exists;

    if (exists) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.CATEGORY_ALREADY_EXISTS}, 'Category already exists');
    }
    try {
        if (params.body?.files?.csv) {
            console.log('csv');
            return new ServiceResponse(405, null);
        }
        else if (params.body?.files?.image) {
            console.log('image');
            return new ServiceResponse(405, null);
        }
        else if (Array.isArray(params.body)) {
            console.log('array');
            return new ServiceResponse(405, null);
        }
        else {
            const category = JSON.parse(params['body'].fields.category);
            category.title = category.categoryTitle;

            await client.query(
                `call insert_sign_category($1::jsonb)`,
                [category]
            );
        }
    }
    catch (e) {
        console.log(e);
        return new ServiceResponse(400, {errorCode: ErrorCodes.FAILED_TO_CREATE_SIGN_CATEGORY}, 'Failed to create');
    }
});

const addSign = async (client, sign) => {
    const {image, imageId} = prepImage(sign);
    try {
        await client.query(
            `insert into sign (default, $1::int, $2::varchar, $3::varchar, $4::varchar)`,
            [sign.categoryId, sign.title, sign.description, sign.imageId]
        );
        
        if (image) {
            await image.writeAsync(`./images/${imageId}.png`);
        }
    }
    catch (err) {
        console.log(err);
        return new ServiceResponse(400, {ErrorCodes: ErrorCodes.FAILED_TO_CREATE_SIGNS}, 'Failed to create sign');
    }
}

export const addSignsToCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }
    try {
        if (params['body']?.files?.csv) {
            const parsedSigns = await parseCSV(params['body']?.files?.csv);
            for (const sign of parsedSigns) {
                const result = addSign(client, sign);
                if (result.status < 200 || 299 < result.status) {
                    return result;
                }
            }
            return ServiceResponse(204, null, 'Successfully created multiple signs');
        }
        else if (params['body']?.files?.image) { // single file with image 
            const sign = JSON.parse(params['body'].fields.sign);
            sign.imageInfo = params['body'].files.image.filepath;
            return addSign(client, sign);
        }
        else if (params['body']?.fields?.signs) { // multiple signs from array obj
            const signs = JSON.parse(params['body']?.fields?.signs);
            for (const sign of signs) {
                const result = await addSign(client, sign);
                if (result.status < 200 || 299 < result.status) {
                    return result;
                }
            }
            return ServiceResponse(204, null, 'Successfully created multiple signs');
        }
        else if (params['body']?.fields?.sign) {
            const sign = JSON.parse(params['body'].fields.sign)
            return await addSign(client, sign);
        }
        else {
            return await addSign(client, params['body']);
        }
    } catch (err) {
        console.log(err);
        return new ServiceResponse(400, {errorCode: ErrorCodes.FAILED_TO_CREATE_SIGNS}, 'Failed to create signs');
    }
});

export const deleteSignCategory = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    const authValidation = validateAuth(params['authorization']);
    if (authValidation) {
        return authValidation;
    }
    if (!isAdmin(params['authorization'])) {
        return new ServiceResponse(403, {errorCode: ErrorCodes.UNAUTHORIZED}, 'Unauthorized');
    }

    try {
        const result = (await client.query(
            `delete from sign_category where id = $1::int`, [params.path.id]
        )).rows;
        if (result.length === 0) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.SIGN_CATEGORY_NOT_FOUND});
        }

        return new ServiceResponse(204, null, 'Success');
    } catch (err) {
        return new ServiceResponse(404, {errorCode: ErrorCodes.INVALID_SIGN_CATEGORY});
    }
});
