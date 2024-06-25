import {
    renderQuestion,
    getFormElement,
} from '/components/question/question.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { getUnsolvedExerciseByCategory } from '../requests.js';
import { showLoading } from '/js/render.js';
import { onFormSubmit } from './submit.js';

const populateQuestion = async () => {
    const question = document.getElementById('question-container');
    showLoading(question);
    try {
        const id = document.location.pathname
            .replace(/\/+$/, '')
            .split('/')
            .pop();
        const data = await getUnsolvedExerciseByCategory(id);
        data.answers.sort((a, b) => a.id - b.id);

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
