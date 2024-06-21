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

export const renderQuestionnaireQuestion = async (
    data,
    stats,
    timeInterval = 30 * 60000
) => {
    const questionComponent = await getQuestionnaireComponent();

    let card = document.createElement('div');
    card.classList.add('intrebare-card');
    card.innerHTML = questionComponent;
    card.querySelector('#questionnaire-current-question').innerText =
        data.id - (stats?.id - 1) * 26;
    card.querySelector('#questionnaire-total-questions').innerText =
        stats.totalQuestions;

    card.querySelector('#questionnaire-remaining').innerText =
        stats.unsentQuestions;
    card.querySelector('#questionnaire-correct').innerText =
        stats.totalQuestions - stats.unsolvedQuestions - stats.unsentQuestions;
    card.querySelector('#questionnaire-wrong').innerText =
        stats.unsolvedQuestions;

    card.querySelector('#question-title').innerText = data.text;
    // card.querySelector('#question-current').innerText = data.id;
    // card.querySelector('#question-category').innerText = data.categoryTitle;
    // card.querySelector('#question-next').href = window.location.href;

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

    let countDownDate = new Date(stats.generatedTime).getTime();
    countDownDate = new Date(countDownDate + timeInterval);

    let functionInterval;
    const updateTimer = () => {
        let now = new Date().getTime();

        let distance = countDownDate - now;

        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        card.querySelector('#questionnaire-timer').innerText =
            minutes + ':' + (seconds < 10 ? '0' : '') + seconds;

        if (distance < 0) {
            if (functionInterval) {
                clearInterval(functionInterval);
            }
            card.querySelector('#questionnaire-timer').innerText = '0:00';
        }
    };

    updateTimer();
    functionInterval = setInterval(updateTimer, 1000);

    return card;
};
