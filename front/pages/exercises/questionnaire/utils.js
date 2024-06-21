import {
    getQuestionnaire as apiGetQuestionnaire,
    createQuestionnaire as apiCreateQuestionnaire,
} from '../requests.js';
import { userData } from '/js/auth.js';

const saveQuestionnaire = (questionnaire) => {
    localStorage.setItem('questionnaire', JSON.stringify(questionnaire));
};

export const createQuestionnaire = async () => {
    const user = await userData();
    console.log(user);
    if (!user) {
        // this should never happen, there's going to be a guard on the questionnaire routes, hopefully
        window.location.href = '/exercises';
    }

    // raw callback, in the idea that this'll be error handled somewhere else :)
    const questionnaire = await apiCreateQuestionnaire(user.id);
    saveQuestionnaire(questionnaire);
    return questionnaire;
};

// gets user's questionnaire without creating a new one
export const getQuestionnaire = async () => {
    const data = localStorage.getItem('questionnaire');

    if (data) {
        return JSON.parse(data);
    }

    // fetch questionnaire
    const user = await userData();
    if (!user) {
        // same as above... this should never ever happen
        window.location.href = '/exercises';
    }

    // will most likely be handled some other place :)
    const questionnaire = await apiGetQuestionnaire(user.id);
    saveQuestionnaire(questionnaire);
    return questionnaire;
};

export const setQuestionSent = async (questionId, sentStatus) => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return;
    }
    const question = questionnaire.questions.find((q) => q.id === questionId);
    if (question) {
        question.sent = sentStatus;
        saveQuestionnaire(questionnaire);
    }
};

export const setQuestionSolved = async (questionId, solvedStatus) => {
    const questionnaire = getQuestionnaire();
    if (questionnaire) {
        const question = questionnaire.questions.find(
            (q) => q.id === questionId
        );
        if (question) {
            question.solved = solvedStatus;
            saveQuestionnaire(questionnaire);
        }
    }
};

export const getQuestionnaireStats = async () => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return null;
    }

    const totalQuestions = questionnaire.questions.length;
    const unsolvedQuestions = questionnaire.questions.filter(
        (q) => !q.solved
    ).length;
    const unsentQuestions = questionnaire.questions.filter(
        (q) => !q.sent
    ).length;

    return {
        totalQuestions,
        unsolvedQuestions,
        unsentQuestions,
    };
};

export const getUnsolvedQuestionsCount = () => {
    const stats = getQuestionnaireStats();
    return stats ? stats.unsolvedQuestions : 0;
};

export const getUnsentQuestionsCount = () => {
    const stats = getQuestionnaireStats();
    return stats ? stats.unsentQuestions : 0;
};

export const skipQuestion = async (questionId) => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return;
    }
    const question = questionnaire.questions.find((q) => q.id === questionId);
    if (question) {
        question.skipped = true;
        saveQuestionnaire();
    }
};

export const getFirstUnansweredQuestion = async () => {
    const questionnaire = await getQuestionnaire();
    let allSkipped = true;
    for (let i = 0; i < questionnaire.questions.length; i++) {
        const question = questionnaire.questions[i];
        if (!question.solved && question.skipped !== true) {
            allSkipped = false;
            questionnaire.currentQuestionIndex = i;
            saveQuestionnaire();
            return question;
        }
    }
    if (allSkipped) {
        // Delete skipped status and return the first question
        questionnaire.questions.forEach((q) => delete q.skipped);
        saveQuestionnaire();
        return questionnaire.questions[0];
    }
    return null;
};
