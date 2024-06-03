const API_URL = 'http://localhost:12734/api/v1';

const fetchUnsolved = async () => {
    const bearerToken = localStorage.getItem('token');
    let headers = {};
    if (bearerToken) {
        headers = { Authorization: 'Bearer ' + bearerToken };
    }

    const id = new URLSearchParams(document.location.search).get('category');
    const response = await fetch(`${API_URL}/exercises/unsolved/${id}`, {
        method: 'GET',
        headers: headers,
    });

    if (response.status === 404) {
        window.location.href = './'; // extreme measures
    }
    const data = await response.json();
    return data;
};

const submitAnswer = async (data) => {
    const bearerToken = localStorage.getItem('token');
    let headers = {};
    if (bearerToken) {
        headers = { Authorization: 'Bearer ' + bearerToken };
    }

    const response = await fetch(`${API_URL}/users/${bearerToken}/solutions`, {
        method: 'POST',
        body: JSON.stringify(data),
        headers: headers,
    });

    console.log(response);
};

const showLoading = (domNode) => {
    domNode.innerText = 'Se încarcă...';
};

const renderAnswer = (answer) => {
    const listItem = document.createElement('li');
    listItem.className = 'intrebare-card__answer';

    const hiddenInput = document.createElement('input');
    hiddenInput.type = 'hidden';
    hiddenInput.name = answer.answerId;
    hiddenInput.id = answer.answerId;
    hiddenInput.value = false;

    const input = document.createElement('input');
    input.type = 'checkbox';
    input.name = answer.answerId;
    input.id = answer.answerId;
    input.value = true;

    const label = document.createElement('label');
    label.htmlFor = answer.answerId;
    label.id = `${answer.answerId}-label`;
    label.textContent = answer.description;

    listItem.appendChild(input);
    listItem.appendChild(label);

    return listItem;
};

const renderQuestion = (data) => {
    document.getElementById('question-title').innerText = data.questionText;
    document.getElementById('current-question').innerText = data.questionId;
    document.getElementById('category').innerText = data.categoryTitle;

    if (data.questionImage != null) {
        const img = document.createElement('img');
        img.src = data.questionImage;

        document.getElementById('image-wrapper').appendChild(img);
    } else {
        document.getElementById('image-wrapper').style.display = 'none';
    }

    const answerContainer = document.getElementById('question-answers');
    data.answers.forEach((answer) => {
        answerContainer.appendChild(renderAnswer(answer));
    });
};

const populateQuestion = async () => {
    const type = new URLSearchParams(document.location.search).get('type');

    let data = null;
    if (type === 'unsolved') {
        data = await fetchUnsolved();
    }

    if (!data) {
        return;
    }

    console.log(data);
    renderQuestion(data);

    const form = document.getElementById('question-form');
    form.addEventListener('submit', async (event) => {
        await onFormSubmit(data, event);
    });
};

window.addEventListener('load', populateQuestion);

const onFormSubmit = async (questionData, event) => {
    event.preventDefault();

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());
    // console.log(dataObject);

    const submitData = {
        questionId: questionData.questionId,
        answers: questionData.answers.map((answer) => ({
            answerId: answer.answerId,
            selected: answer.answerId in dataObject,
        })),
    };

    console.log(submitData);
    await submitAnswer(submitData);
};
