import API from '/js/api.js';
import { post, del } from '/js/requests.js';

export const requestChange = async (type) => {
    await post(`${API.AUTH}/auth/change-credentials`, {
        type,
    });
};

export const deleteAccount = async (id) => {
    await del(`${API.USERS}/users/${id}`);
};

export const resetProgress = async (id) => {
    await del(`${API.USERS}/users/${id}/progress`);
};
