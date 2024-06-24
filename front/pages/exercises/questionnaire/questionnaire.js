import {
    createQuestionnaire,
    getFirstUnansweredQuestion,
    getQuestionnaire,
    getQuestionnaireStats,
    submitSolution,
    skipQuestion,
    submitQuestionnaire,
    setQuestionnaireTimeout,
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
import { isAdmin } from '/js/auth.js';

/**
 * Submits the question form.
 * @param {*} questionData data of question
 * @param {*} questionCard DOM node corresponding to the question card
 * @param {*} event form submit event
 */
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

/**
 * Disables all the buttons and links outside of the target node,
 * making them show a modal upon clicking, saying the user
 * cannot leave the page in the middle of a questionnaire
 *
 * @param {*} targetNode container node for buttons and links
 * that shall not be disabled
 */
const disableOuterLinks = (targetNode) => {
    if (isAdmin()) {
        return;
    }
    const showModal = () => {
        showInfoModal(
            renderMessage('Nu puteți părăsi pagina în timpul unui chestionar.')
        );
    };

    const allButtons = document.querySelectorAll('button');
    const allLinks = document.querySelectorAll('a');

    const innerButtons = targetNode.querySelectorAll('button');
    const innerLinks = targetNode.querySelectorAll('a');

    const innerButtonsArray = Array.from(innerButtons);
    const innerLinksArray = Array.from(innerLinks);

    const linkExceptions = ['/logout'];

    allButtons.forEach((button) => {
        if (!innerButtonsArray.includes(button)) {
            button.addEventListener('click', showModal);
            button.disabled = true;
        }
    });

    allLinks.forEach((link) => {
        if (
            !innerLinksArray.includes(link) &&
            !linkExceptions.includes(link.href)
        ) {
            link.addEventListener('click', showModal);
            link.href = 'javascript:void(0)';
        }
    });
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

        disableOuterLinks(questionCard);
        setQuestionnaireTimeout();
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/exercises';
        });
    }
});
