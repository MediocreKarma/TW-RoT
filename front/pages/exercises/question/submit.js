import {
    setDisabled,
    showCorrectAnswers,
} from '/components/question/question.js';
import { getExerciseSolution, submitSolution } from '../requests.js';
import { cachedUserData } from '/js/auth.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';

const checkAnswers = (userAnswers, correctAnswers) => {
    const userAnswerIds = userAnswers
        .filter((answer) => answer.selected)
        .map((answer) => answer.id);

    const correctAnswerIds = correctAnswers
        .filter((answer) => answer.correct)
        .map((answer) => answer.id);

    if (userAnswerIds.length !== correctAnswerIds.length) {
        return false;
    }

    userAnswerIds.sort();
    correctAnswerIds.sort();

    for (let i = 0; i < userAnswerIds.length; i++) {
        if (userAnswerIds[i] !== correctAnswerIds[i]) {
            return false;
        }
    }

    return true;
};

export const onFormSubmit = async (questionData, questionCard, event) => {
    event.preventDefault();

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    const submitData = {
        id: questionData.id,
        answers: questionData.answers.map((answer) => ({
            id: answer.id,
            selected: answer.id in dataObject,
        })),
    };
    console.log(submitData);

    const user = cachedUserData();

    setDisabled(questionCard, true);

    let answerData;
    try {
        if (!user) {
            const responseData = await getExerciseSolution(questionData.id);
            console.log(responseData);
            answerData = {
                isCorrect: checkAnswers(submitData.answers, responseData),
                correctAnswers: responseData,
            };
        } else {
            const responseData = await submitSolution(user.id, submitData);
            console.log(responseData);
            answerData = responseData;
        }
    } catch (e) {
        showInfoModal(renderError(e));
        setDisabled(questionCard, false);
        return;
    }

    showCorrectAnswers(questionCard, answerData);
};
