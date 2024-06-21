export const resetOptions = (questionCard) => {
    const checkboxes = questionCard.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
    });
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

export const getFormElement = (question) => {
    return question.querySelector('#question-form');
};

export const renderAnswer = (answer) => {
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
