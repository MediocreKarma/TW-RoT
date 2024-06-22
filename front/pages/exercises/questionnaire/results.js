import {
    createQuestionnaire,
    getQuestionnaire,
    getQuestionnaireStats,
    getQuestionnaireStatsFromExisting,
} from './common.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { renderMessage } from '/js/render.js';
import { cachedUserData } from '/js/auth.js';

const getWronglySolvedQuestions = (questionnaireData) => {
    return questionnaireData.questions.filter(
        (question) => !question.solved && question.sent
    );
};

const getSolvedQuestions = (questionnaireData) => {
    return questionnaireData.questions.filter(
        (question) => question.solved === true
    );
};

const getUnansweredQuestions = (questionnaireData) => {
    return questionnaireData.questions.filter((question) => !question.sent);
};

const renderQuestion = (question) => {
    const questionDiv = document.createElement('div');
    questionDiv.classList.add('questionnaire-results__question');
    questionDiv.classList.add(
        `questionnaire-results__question--${
            question.solved ? 'solved' : question.sent ? 'unsolved' : 'unsent'
        }`
    );

    const questionText = document.createElement('h3');
    questionText.innerText = question.text;
    questionDiv.appendChild(questionText);

    const questionContentsDiv = document.createElement('div');
    questionContentsDiv.classList.add(
        'questionnaire-results__question__contents'
    );

    const answersList = document.createElement('ul');
    answersList.classList.add('answers');

    question.answers.forEach((answer) => {
        const answerItem = document.createElement('li');
        // add WRONG or RIGHT in the front
        let correctness = document.createElement('span');
        correctness.innerHTML = answer.correct ? '✓' : '✖';
        correctness.classList.add(`questionnaire-results__answer__status`);
        correctness.classList.add(
            `questionnaire-results__answer__status--${
                answer.correct ? 'correct' : 'wrong'
            }`
        );
        answerItem.appendChild(correctness);

        let textNode = document.createElement(
            answer.selected ? 'strong' : 'span'
        );
        textNode.innerHTML = answer.description;

        answerItem.append(textNode);
        answersList.appendChild(answerItem);
    });

    questionContentsDiv.appendChild(answersList);

    // image wrapper

    const imageWrapper = document.createElement('div');
    imageWrapper.classList.add('questionnaire-results__question__image');

    if (question.image != null) {
        const img = document.createElement('img');
        img.src = question.image;

        imageWrapper.appendChild(img);
    } else {
        imageWrapper.style.display = 'none';
    }
    questionContentsDiv.appendChild(imageWrapper);

    questionDiv.appendChild(questionContentsDiv);

    return questionDiv;
};

const renderQuestionArray = (questionArray, title) => {
    const questionsDiv = document.createElement('div');
    questionsDiv.classList.add('questionnaire-results__questions');

    const questionsTitle = document.createElement('h2');
    questionsTitle.innerText = title;
    questionsDiv.appendChild(questionsTitle);

    questionArray.forEach((question) => {
        const questionDiv = renderQuestion(question);
        questionsDiv.appendChild(questionDiv);
    });

    return questionsDiv;
};

const renderStatus = (questionnaire) => {
    const statusDiv = document.createElement('div');
    statusDiv.classList.add('questionnaire-results__stats');

    const stats = getQuestionnaireStatsFromExisting(questionnaire);

    const statusNode = document.createElement('h3');
    console.log(stats);

    const correctQuestions =
        stats.totalQuestions - stats.unsolvedQuestions - stats.unsentQuestions;

    statusNode.innerHTML = `Ai fost declarat <strong>${
        correctQuestions < 22 ? 'RESPINS' : 'ADMIS'
    }</strong> la acest chestionar auto.`;
    statusDiv.appendChild(statusNode);

    const scoreNode = document.createElement('span');
    scoreNode.innerHTML = `Scor: ${correctQuestions} / ${stats.totalQuestions}`;
    statusDiv.appendChild(scoreNode);

    return statusDiv;
};

const addListenerToNewQuestionnaireButton = () => {
    const btn = document.getElementById('new-questionnaire');

    if (!btn) {
        return;
    }

    btn.addEventListener('click', async () => {
        try {
            await createQuestionnaire();
        } catch (e) {
            showInfoModal(renderError(e));
            return;
        }

        window.location.href = '/exercises/questionnaire';
    });
};

window.addEventListener(
    'load',
    async () => {
        addListenerToNewQuestionnaireButton();

        const resultsDiv = document.getElementById('results');
        try {
            const questionnaireData = await getQuestionnaire();

            const status = renderStatus(questionnaireData);
            resultsDiv.appendChild(status);

            const questionsData = [
                {
                    questions: getWronglySolvedQuestions(questionnaireData),
                    title: 'Întrebări la care ai răspuns greșit',
                },
                {
                    questions: getSolvedQuestions(questionnaireData),
                    title: 'Întrebări la care ai răspuns corect',
                },
                {
                    questions: getUnansweredQuestions(questionnaireData),
                    title: 'Întrebări la care nu ai răspuns',
                },
            ];

            questionsData.forEach(({ questions, title }) => {
                if (questions.length !== 0) {
                    resultsDiv.appendChild(
                        renderQuestionArray(questions, title)
                    );
                }
            });
        } catch (e) {
            showInfoModal(renderError(e), () => {
                window.location.href = '/exercises';
            });
        }
    },
    false
);
