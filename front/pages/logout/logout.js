import API from '/js/api.js';
import { post } from '/js/requests.js';
import { clearUserData } from '/js/auth.js';
import { getErrorCode } from '/js/errors.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await post(`${API.AUTH}/auth/logout`, null);
        clearUserData();
    } catch (e) {
        // not much to do. mute error
    } finally {
        window.location.href = '/';
    }
});
