import { ErrorCodes } from '/js/constants.js';
import {
    getQuestionnaire as apiGetQuestionnaire,
    createQuestionnaire as apiCreateQuestionnaire,
    submitQuestionnaireSolution as apiSubmitQuestionnaireSolution,
    submitQuestionnaire as apiSubmitQuestionnaire,
} from '../requests.js';
import { cachedUserData, UserData } from '/js/auth.js';

/**
 * Saves questionnaire object to localStorage.
 * @param {*} questionnaire questionnaire object
 */
const saveQuestionnaire = (questionnaire) => {
    localStorage.setItem(UserData.questionnaire, JSON.stringify(questionnaire));
};

/**
 * Creates new questionnaire by calling the API.
 * @returns questionnaire, if creation successful
 */
export const createQuestionnaire = async () => {
    const user = cachedUserData();
    if (!user) {
        // this should never happen, there's going to be a guard on the questionnaire routes, hopefully
        window.location.href = '/exercises';
    }

    // raw callback, in the idea that this'll be error handled somewhere else :)
    const questionnaire = await apiCreateQuestionnaire(user.id);
    saveQuestionnaire(questionnaire);
    return questionnaire;
};

const QUESTIONNAIRE_INTERVAL_MS = 30 * 60000;
let questionnaireTimeout;

/**
 * Sets timeout for automatic submission of the questionnaire when time runs out.
 */
export const setQuestionnaireTimeout = async () => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return;
    }
    let countDownDate = new Date(
        questionnaire.questionnaire.generatedTime
    ).getTime();
    countDownDate = new Date(countDownDate + QUESTIONNAIRE_INTERVAL_MS);
    var now = new Date().getTime();
    var distance = countDownDate - now;

    if (questionnaireTimeout) {
        clearTimeout(questionnaireTimeout);
    }

    questionnaireTimeout = setTimeout(async () => {
        await submitQuestionnaire();
        window.location.reload();
    }, distance);
};

/**
 * Gets user's questionnaire without creating a new one.
 * @param {*} forceInvalidate whether the local cache should be invalidated,
 * and the questionnaire should be fetched from the server
 * @returns questionnaire object, if successful
 */
export const getQuestionnaire = async (forceInvalidate = false) => {
    if (!forceInvalidate) {
        const data = localStorage.getItem(UserData.questionnaire);

        if (data) {
            try {
                const jsonData = JSON.parse(data);
                let countDownDate = new Date(
                    jsonData.questionnaire.generatedTime
                ).getTime();
                countDownDate = new Date(
                    countDownDate + QUESTIONNAIRE_INTERVAL_MS
                );

                var now = new Date().getTime();

                var distance = countDownDate - now;

                if (distance > 0 && !jsonData.questionnaire.registered) {
                    return jsonData;
                }
            } catch (e) {
                // continue
            }
        }
    }

    // fetch questionnaire again if registered in memory...
    const user = await cachedUserData();
    if (!user) {
        // same as above... this should never ever happen
        window.location.href = '/exercises';
    }

    // will most likely be handled some other place :)
    const questionnaire = await apiGetQuestionnaire(user.id);
    saveQuestionnaire(questionnaire);
    return questionnaire;
};

/**
 * Sets `sent` status of question in local questionnaire to given status.
 * @param {*} questionId id of question
 * @param {*} sentStatus boolean status to set `sent` to
 */
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

/**
 * Sets question `solved` to given `solvedStatus` in local questionnaire.
 * @param {*} questionId id of question
 * @param {*} solvedStatus boolean status
 */
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

/**
 * Returns stats for the provided questionnaire object.
 * @param {*} questionnaire questionnaire object
 * @returns {*} total questions, unsolved questions, unsent questions of questionnaire
 */
export const getQuestionnaireStatsFromExisting = (questionnaire) => {
    const totalQuestions = questionnaire.questions.length;
    const wrongQuestions = questionnaire.questions.filter(
        (q) => q.sent && !q.solved
    ).length;
    const unsentQuestions = questionnaire.questions.filter(
        (q) => !q.sent
    ).length;

    return {
        ...questionnaire.questionnaire,
        totalQuestions,
        unsolvedQuestions: wrongQuestions,
        unsentQuestions,
    };
};

/**
 * Returns stats for either the provided questionnaire object
 * (if provided) or the local questionnaire.
 * @param {*} questionnaire questionnaire object; optional
 * @returns {*} total questions, unsolved questions, unsent questions of questionnaire
 */
export const getQuestionnaireStats = async (questionnaireData = undefined) => {
    const questionnaire = questionnaireData
        ? questionnaireData
        : await getQuestionnaire();
    if (!questionnaire) {
        return null;
    }

    return getQuestionnaireStatsFromExisting(questionnaire);
};

/**
 * Gets unsolved questions of local questionnaire.
 * @returns unsolved questions of local questionnaire
 */
export const getUnsolvedQuestionsCount = () => {
    const stats = getQuestionnaireStats();
    return stats ? stats.unsolvedQuestions : 0;
};

/**
 * Gets unsent questions of local questionnaire.
 * @returns unsent questions of local questionnaire
 */
export const getUnsentQuestionsCount = () => {
    const stats = getQuestionnaireStats();
    return stats ? stats.unsentQuestions : 0;
};

/**
 * Marks question as skipped.
 * @param {*} questionId id of question
 */
export const skipQuestion = async (questionId) => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return;
    }
    const question = questionnaire.questions.find((q) => q.id === questionId);
    if (question) {
        question.skipped = true;
        saveQuestionnaire(questionnaire);
    }
};

/**
 * Gets first unsent, unskipped question from local questionnaire.
 */
export const getFirstUnansweredQuestion = async () => {
    const questionnaire = await getQuestionnaire();
    let allSkipped = true;
    for (let i = 0; i < questionnaire.questions.length; i++) {
        const question = questionnaire.questions[i];
        if (!question.sent && question.skipped !== true) {
            allSkipped = false;
            questionnaire.currentQuestionIndex = i;
            saveQuestionnaire(questionnaire);
            return question;
        }
    }
    if (allSkipped) {
        // delete skipped status and return the first question
        questionnaire.questions.forEach((q) => delete q.skipped);
        saveQuestionnaire(questionnaire);
        const unsent = questionnaire.questions.find(
            (question) => !question.sent
        );
        if (unsent) {
            return unsent;
        }
    }

    return null;
};

/**
 * Submits solution for given question.
 * @param {*} questionId id of question
 * @param {*} answerData answer data
 */
export const submitSolution = async (questionId, answerData) => {
    const questionnaire = await getQuestionnaire();
    if (!questionnaire) {
        return;
    }
    const user = cachedUserData();

    const stats = await getQuestionnaireStats();
    if (stats.registered === true) {
        return;
    }
    if (stats.unsentQuestions === 0) {
        await apiSubmitQuestionnaire(user.id);
        return;
    }

    try {
        const response = await apiSubmitQuestionnaireSolution(
            user.id,
            questionId,
            answerData
        );

        // save to questionnaire
        const question = questionnaire.questions.find(
            (q) => q.id === questionId
        );
        if (question) {
            question.sent = true;
            question.solved = response.isCorrect;
            saveQuestionnaire(questionnaire);
        }
    } catch (e) {
        if (
            e?.body?.errorCode !==
            ErrorCodes.QUESTION_SOLUTION_ALREADY_SUBMITTED
        ) {
            throw e;
        }
        getQuestionnaire(true); // force reload of questionnaire
        throw e;
    }
    await trySubmittingQuestionnaireAutomatically();
};

/**
 * Submits the local questionnaire automatically, if either the questionnaire
 * has over 4 questions answered wrongly or all of the questions have been answered.
 */
export const trySubmittingQuestionnaireAutomatically = async () => {
    const questionnaireStats = await getQuestionnaireStats();

    if (
        questionnaireStats.unsolvedQuestions >= 5 ||
        questionnaireStats.unsentQuestions === questionnaireStats.totalQuestions
    ) {
        await submitQuestionnaire();
    }
};

/**
 * Submits the local questionnaire.
 */
export const submitQuestionnaire = async () => {
    const user = cachedUserData();
    const questionnaire = await getQuestionnaire();
    await apiSubmitQuestionnaire(user.id);
    questionnaire.questionnaire.registered = true;
    saveQuestionnaire(questionnaire);
};
