import { get } from '/js/requests.js';

const renderAnswer = (answer) => {
    const listItem = document.createElement('li');
    listItem.className = 'intrebare-card__answer';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = answer.id;
    hiddenInput.id = answer.id;
    hiddenInput.value = false;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = answer.id;
    input.id = answer.id;
    input.value = true;

    const label = document.createElement('label');
    label.htmlFor = answer.id;
    label.id = `${answer.id}-label`;
    label.textContent = answer.description;

    listItem.appendChild(input);
    listItem.appendChild(label);

    return listItem;
};

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

const resetOptions = (questionCard) => {
    const checkboxes = questionCard.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });
};

export const getFormElement = (question) => {
    return question.querySelector('#question-form');
};

export const setDisabled = (question, value) => {
    let submitButton = getFormElement(question).querySelector(
        'button[type=submit]'
    );
    let modifyButton = getFormElement(question).querySelector(
        'button#question-modify-answers'
    );
    submitButton.disabled = value;
    modifyButton.disabled = value;
};

export const showCorrectAnswers = (
    questionCard,
    { isCorrect, correctAnswers }
) => {
    correctAnswers.forEach((answer) => {
        const label = questionCard.querySelector(`label[for="${answer.id}"]`);
        if (label) {
            label.textContent += answer.correct ? ' [corect]' : ' [greșit]';
        }
    });

    const resultMessage = document.createElement('p');
    resultMessage.className = isCorrect
        ? 'intrebare-card__right'
        : 'intrebare-card__wrong';
    resultMessage.textContent = `Ai răspuns ${
        isCorrect ? 'corect' : 'greșit'
    }!`;

    const cardBody = questionCard.querySelector('.intrebare-card__body');
    if (cardBody) {
        cardBody.appendChild(resultMessage);
    }
};
