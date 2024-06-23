import {
    get as rawGet,
    post as rawPost,
    put as rawPut,
    patch as rawPatch,
    del as rawDel,
    postFormData as rawPostFormData,
} from '/js/requests.js';
import { ErrorCodes } from '/js/constants.js';
import { userData } from './auth.js';

export function withAuthCheck(fetchFunction) {
    return async function (...args) {
        try {
            return await fetchFunction(...args);
        } catch (error) {
            if (error?.body?.errorCode === ErrorCodes.BANNED) {
                window.location.href = '/banned';
                return;
            } else if (error?.status === 401) {
                await userData();
            }
            throw error;
        }
    };
}

export const get = withAuthCheck(rawGet);
export const post = withAuthCheck(rawPost);
export const put = withAuthCheck(rawPut);
export const patch = withAuthCheck(rawPatch);
export const del = withAuthCheck(rawDel);
export const postFormData = withAuthCheck(rawPostFormData);
