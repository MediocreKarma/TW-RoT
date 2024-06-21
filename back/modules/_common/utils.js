import { ServiceResponse } from "./serviceResponse.js";
import { isStringValidInteger } from "../../common/utils.js";

export const validateAuth = (authorization) => {
    if (Number.isInteger(authorization?.errorCode)) {
        return new ServiceResponse(401, {errorCode: authorization?.errorCode}, 'Unauthenticated');
    }
    return null;
}

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