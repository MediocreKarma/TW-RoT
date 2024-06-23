import API from '/js/api.js';
import { get, patch, del } from '/js/requests.js';

export const getExercises = async (start, count, query) => {
    const response = await get(
        `${API.EXERCISES}/exercises?start=${start}&count=${count}${
            query ? `&query=${query}` : ''
        }`
    );
    return await response.json();
};

export const deleteExercise = async (questionId) => {
    await del(`${API.EXERCISES}/exercises/${questionId}`);
};

export const getUsers = async (start, count, query) => {
    const response = await get(
        `${API.USERS}/users?start=${start}&count=${count}${
            query ? `&query=${query}` : ''
        }`
    );
    return await response.json();
};

export const patchBanUser = async (userId, banned) => {
    await patch(`${API.USERS}/users/${userId}/banned`, {
        banned,
    });
};

export const deleteUserProgress = async (userId) => {
    await del(`${API.USERS}/users/${userId}/progress`);
};

export const deleteUser = async (userId) => {
    await del(`${API.USERS}/users/${userId}`);
};
