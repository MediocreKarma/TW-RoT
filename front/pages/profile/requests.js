import API from '/js/api.js';
import { post } from '/js/requests.js';

export const requestChange = async (type) => {
    await post(`${API.AUTH}/auth/change-credentials`, {
        type,
    });
};
