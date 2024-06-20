import API from '/js/api.js';
import { post } from '/js/requests.js';
import { clearUserData } from '/js/auth.js';
import { getErrorCode } from '/js/errors.js';
import { ErrorCodes } from '/js/constants.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await post(`${API.AUTH}/auth/logout`, null);
        clearUserData();
        window.location.href = '/';
    } catch (e) {
        if (e?.body?.errorCode == ErrorCodes.AUTH_COOKIE_NOT_FOUND) {
            clearUserData();
            window.location.href = '/';
            return;
        }
        window.location.href = `/?errorCode=${
            getErrorCode(e) ? getErrorCode(e) : 0
        }`;
    }
});
