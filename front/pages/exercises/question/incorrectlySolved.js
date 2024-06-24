import {
    renderQuestion,
    getFormElement,
} from '/components/question/question.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { getIncorrectlySolvedExercise } from '../requests.js';
import { showLoading, renderMessage } from '/js/render.js';
import { onFormSubmit } from './submit.js';
import { cachedUserData } from '/js/auth.js';

const populateQuestion = async () => {
    const question = document.getElementById('question-container');
    showLoading(question);
    if (!cachedUserData()) {
        showInfoModal(
            renderMessage(
                'Nu puteți accesa această funcționalitate fiindcă nu sunteți autentificat.'
            ),
            () => {
                window.location.href = '/exercises';
            }
        );
        return;
    }
    try {
        let data = await getIncorrectlySolvedExercise();
        data.answers.sort((a, b) => a.id - b.id);
        console.log(data);

        const card = await renderQuestion(data);
        question.replaceWith(card);

        const form = getFormElement(card);
        form.addEventListener('submit', async (event) => {
            await onFormSubmit(data, card, event);
        });
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/exercises';
        });
    }
};

window.addEventListener('load', populateQuestion);
