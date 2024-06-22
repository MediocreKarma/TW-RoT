import { ServiceResponse } from "./serviceResponse.js";
import { isStringValidInteger } from "../../common/utils.js";

/**
 * Utility function to validate the 
 * authorization of a given user
 * by checking whether or not it contains an errorCode
 * 
 * @param {*} authorization the authorization object
 * @returns ServiceResponse on error, else null
 */
export const validateAuth = (authorization) => {
    if (Number.isInteger(authorization?.errorCode)) {
        return new ServiceResponse(401, {errorCode: authorization?.errorCode}, 'Unauthenticated');
    }
    return null;
}

/**
 * Validate field is nonnegative integer
 * 
 * @param {*} field field to check
 * @param {*} fieldName the name of the field, for the adequate ErrorCode
 * @returns ServiceResponse on error, else null
 */
const validateNonnegativeIntegerField = (field, fieldName) => {
    const capitalizedFieldName = fieldName.toUpperCase();
    if (!isStringValidInteger(field)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_INTEGER`]});
    }
    const value = parseInt(field, 10);
    if (value < 0) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_NONNEGATIVE_INTEGER`]});
    }
    return null;
}

/**
 * Validate the start and count query param strings
 * 
 * @param {*} startStr 
 * @param {*} countStr 
 * @returns ServiceResponse on error, else null
 */
export const validateStartAndCountParams = (startStr, countStr) => {
    const startValidation = validateNonnegativeIntegerField(startStr, 'start');
    if (startValidation) {
        return startValidation;
    }
    const countValidation = validateNonnegativeIntegerField(countStr, 'count');
    if (countValidation) {
        return countValidation;
    }
    return null;
}