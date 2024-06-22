import API from '/js/api.js';
import { get, del } from '/js/requests.js';

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
