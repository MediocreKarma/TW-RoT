import {
    createQuestionnaire,
    getFirstUnansweredQuestion,
    getQuestionnaire,
    getQuestionnaireStats,
    submitSolution,
    skipQuestion,
    submitQuestionnaire,
} from './common.js';
import { cachedUserData } from '/js/auth.js';
import { renderMessage } from '/js/render.js';
import { ErrorCodes } from '/js/constants.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import {
    renderQuestionnaireQuestion,
    getFormElement,
    setDisabled,
} from '/components/question/questionnaire.js';

export const onFormSubmit = async (questionData, questionCard, event) => {
    event.preventDefault();

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    const submitData = questionData.answers.map((answer) => ({
        id: answer.id,
        selected: answer.id in dataObject,
    }));

    setDisabled(questionCard, true);

    try {
        await submitSolution(questionData.id, submitData);
        window.location.reload(); // aka get the next question, or results if ended... etc
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.reload();
        });
        return;
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    if (!cachedUserData()) {
        showInfoModal(
            renderMessage(
                'Nu puteți accesa această funcționalitate fiindcă nu sunteți autentificat. Veți fi redirectat la pagina principală.'
            ),
            () => {
                window.location.href = '/';
            }
        );
        return;
    }

    let questionnaireData;
    try {
        questionnaireData = await getQuestionnaire();
    } catch (e) {
        if (e?.body?.errorCode !== ErrorCodes.NO_USER_QUESTIONNAIRE) {
            showInfoModal(renderError(e), () => {
                window.location.href = '/exercises';
            });
            return;
        }
        // NO_USER_QUESTIONNAIRE is the only case where I can truly take action
    }

    if (questionnaireData?.questionnaire?.registered === true) {
        window.location.href = '/exercises/questionnaire/results';
    }

    if (!questionnaireData) {
        // try creating questionnaire if not exists
        try {
            await createQuestionnaire();
        } catch (e) {
            showInfoModal(renderError(e), () => {
                window.location.href = '/exercises'; // not much I can do
            });
        }
    }

    try {
        const question = await getFirstUnansweredQuestion();
        if (question === null) {
            await submitQuestionnaire();
            window.location.reload();
        }
        const stats = await getQuestionnaireStats();

        const questionCard = await renderQuestionnaireQuestion(question, stats);
        document.getElementById('question-card').replaceWith(questionCard);

        const form = getFormElement(questionCard);
        form.addEventListener('submit', async (event) => {
            await onFormSubmit(question, questionCard, event);
        });
        const answerLater = document.getElementById('question-answer-later');
        answerLater.addEventListener('click', async (event) => {
            event.target.disabled = true;
            try {
                await skipQuestion(question.id);
                window.location.reload();
            } catch (e) {
                showInfoModal(renderError(e));
                event.target.disabled = false;
            }
        });
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/exercises';
        });
    }
});
