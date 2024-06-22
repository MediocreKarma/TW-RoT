import { ErrorCodes } from '/js/constants.js';
import {
    getQuestionnaire as apiGetQuestionnaire,
    createQuestionnaire as apiCreateQuestionnaire,
    submitQuestionnaireSolution as apiSubmitQuestionnaireSolution,
    submitQuestionnaire as apiSubmitQuestionnaire,
} from '../requests.js';
import { cachedUserData, UserData } from '/js/auth.js';

const saveQuestionnaire = (questionnaire) => {
    localStorage.setItem(UserData.questionnaire, JSON.stringify(questionnaire));
};

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

// gets user's questionnaire without creating a new one
// forceInvalidate forces fetching from server
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

export const getQuestionnaireStats = async (questionnaireData = undefined) => {
    const questionnaire = questionnaireData
        ? questionnaireData
        : await getQuestionnaire();
    if (!questionnaire) {
        return null;
    }

    return getQuestionnaireStatsFromExisting(questionnaire);
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
        saveQuestionnaire(questionnaire);
    }
};

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
        return questionnaire.questions[0];
    }

    return null;
};

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

export const trySubmittingQuestionnaireAutomatically = async () => {
    const questionnaireStats = await getQuestionnaireStats();

    const timedOut = false; // TODO: CHECK WITH GENERATED TIME....

    // either you timed out or you're cooked
    if (!timedOut && questionnaireStats.unsolvedQuestions < 4) {
        return;
    }

    await submitQuestionnaire();
};

export const submitQuestionnaire = async () => {
    const user = cachedUserData();
    const questionnaire = await getQuestionnaire();
    await apiSubmitQuestionnaire(user.id);
    questionnaire.questionnaire.registered = true;
    saveQuestionnaire(questionnaire);
};
