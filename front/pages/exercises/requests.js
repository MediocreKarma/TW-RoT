import API from '/js/api.js';
import { get, post, put } from '/js/authRequests.js';

export const getExerciseCategories = async () => {
    const response = await get(`${API.EXERCISES}/exercises/categories`);
    return await response.json();
};

export const getUnsolvedExercise = async () => {
    const response = await get(`${API.EXERCISES}/exercises/unsolved/random`);
    return await response.json();
};

export const getUnsolvedExerciseByCategory = async (categoryId) => {
    const response = await get(
        `${API.EXERCISES}/exercises/categories/${categoryId}/unsolved/random`
    );
    return await response.json();
};

export const getIncorrectlySolvedExercise = async () => {
    const response = await get(
        `${API.EXERCISES}/exercises/incorrectly-solved/random`
    );
    return await response.json();
};

export const getExerciseSolution = async (exerciseId) => {
    const response = await get(
        `${API.EXERCISES}/exercises/${exerciseId}/solution`
    );
    return await response.json();
};

export const submitSolution = async (userId, solutionData) => {
    const response = await post(
        `${API.EXERCISES}/users/${userId}/submissions`,
        solutionData
    );
    return await response.json();
};

export const createQuestionnaire = async (userId) => {
    const response = await post(
        `${API.EXERCISES}/users/${userId}/questionnaire`
    );
    return await response.json();
};

export const getQuestionnaire = async (userId) => {
    const response = await get(
        `${API.EXERCISES}/users/${userId}/questionnaire`
    );
    return await response.json();
};

export const submitQuestionnaireSolution = async (
    userId,
    questionId,
    answerData
) => {
    const response = await post(
        `${API.EXERCISES}/users/${userId}/questionnaire/questions/${questionId}/solution`,
        answerData
    );
    return await response.json();
};

export const submitQuestionnaire = async (userId) => {
    const response = await put(
        `${API.EXERCISES}/users/${userId}/questionnaire/submitted`
    );
    return await response.json();
};
