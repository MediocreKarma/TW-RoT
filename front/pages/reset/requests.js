import API from '/js/api.js';
import { post } from '/js/authRequests.js';

export const changePassword = async (token, value) => {
    await post(`${API.AUTH}/auth/change-password`, { token, value });
};

export const changeEmail = async (token, value) => {
    await post(`${API.AUTH}/auth/change-email`, { token, value });
};

export const changeUsername = async (token, value) => {
    await post(`${API.AUTH}/auth/change-username`, { token, value });
};

export const requestChangePassword = async (email) => {
    await post(`${API.AUTH}/auth/change-credentials`, {
        email,
        type: 'password',
    });
};
