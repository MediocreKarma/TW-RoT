import API from '/js/api.js';
import { get, post, postFormData, patch, del } from '/js/authRequests.js';

export const getExercises = async (start, count, query) => {
    const response = await get(
        `${API.EXERCISES}/exercises?start=${start}&count=${count}${
            query ? `&query=${query}` : ''
        }`
    );
    return await response.json();
};

export const getExercise = async (questionId) => {
    const response = await get(`${API.EXERCISES}/exercises/${questionId}`);
    return await response.json();
};

export const getExerciseCategories = async () => {
    const response = await get(`${API.EXERCISES}/exercises/categories`);
    return await response.json();
};

export const postExercise = async (questionData) => {
    const response = await postFormData(
        `${API.EXERCISES}/exercises`,
        questionData
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

export const changeUserEmail = async (userId, email) => {
    await post(`${API.AUTH}/auth/change-email`, {
        id: userId,
        value: email,
    });
};
