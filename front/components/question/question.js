import { get } from '/js/requests.js';
import {
    resetOptions,
    setDisabled,
    renderAnswer,
    getFormElement,
} from './common.js';

export { setDisabled, getFormElement }; // forward importing :)

const getQuestionComponent = async () => {
    const response = await get('/components/question/question.html');
    return await response.text();
};

export const renderQuestion = async (data) => {
    const questionComponent = await getQuestionComponent();

    let card = document.createElement('div');
    card.classList.add('intrebare-card');
    card.innerHTML = questionComponent;

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

export const showCorrectAnswers = (
    questionCard,
    { correctAnswers, isCorrect = undefined }
) => {
    correctAnswers.forEach((answer) => {
        const label = questionCard.querySelector(`label[for="${answer.id}"]`);
        if (label) {
            label.textContent += answer.correct ? ' \u2705' : ' \u274C';
        }
        const inputCheckbox = document.getElementById(`${answer.id}`);
        if (inputCheckbox) {
            inputCheckbox.disabled = true;
        }
    });

    const resultMessage = document.createElement('p');
    resultMessage.className = isCorrect
        ? 'intrebare-card__right'
        : 'intrebare-card__wrong';
    resultMessage.textContent = `Ai răspuns ${
        isCorrect ? 'corect' : 'greșit'
    }!`;

    const buttons = questionCard.querySelector('.intrebare-card__buttons');
    if (buttons) {
        buttons.parentNode.insertBefore(resultMessage, buttons);
    }
};
