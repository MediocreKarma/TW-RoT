import API from '/js/api.js';
import { get, postFormData, put } from '/js/requests.js';

export const getExerciseCategories = async () => {
    const response = await get(`${API.EXERCISES}/exercises/categories`);
    return await response.json();
};

export const submitExercise = async (questionData) => {
    const response = await postFormData(
        `${API.EXERCISES}/exercises`,
        questionData
    );
    return await response.json();
};
