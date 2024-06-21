import { get } from '/js/requests.js';
import {
    resetOptions,
    setDisabled,
    renderAnswer,
    getFormElement,
} from './common.js';

export { setDisabled, getFormElement }; // forward importing :)

const getQuestionnaireComponent = async () => {
    const response = await get('/components/question/questionnaire.html');
    return await response.text();
};

export const renderQuestionnaireQuestion = async (data, stats) => {
    const questionComponent = await getQuestionnaireComponent();

    let card = document.createElement('div');
    card.classList.add('intrebare-card');
    card.innerHTML = questionComponent;
    document.getElementById('questionnaire-current-question').innerText =
        questionnaire.currentQuestionIndex + 1;
    document.getElementById('questionnaire-total-questions').innerText =
        questionnaire.totalQuestions;

    card.querySelector('#questionnaire-remaining').innerText =
        stats.remainingQuestions;
    card.querySelector('#questionnaire-correct').innerText =
        stats.correctAnswers;
    card.querySelector('#questionnaire-wrong').innerText = stats.wrongAnswers;

    card.querySelector('#question-title').innerText = data.text;
    card.querySelector('#question-current').innerText = data.id;
    card.querySelector('#question-category').innerText = data.categoryTitle;
    card.querySelector('#question-next').href = window.location.href;

    if (data.image != null) {
        const img = document.createElement('img');
        img.src = data.image;

        card.querySelector('#question-image-wrapper').appendChild(img);
    } else {
        card.querySelector('#question-image-wrapper').style.display = 'none';
    }

    const answerContainer = card.querySelector('#question-answers');
    data.answers.forEach((answer) => {
        answerContainer.appendChild(renderAnswer(answer));
    });

    const modifyButton = card.querySelector('#question-modify-answers');
    if (modifyButton) {
        modifyButton.addEventListener('click', () => {
            resetOptions(card);
        });
    }

    return card;
};
