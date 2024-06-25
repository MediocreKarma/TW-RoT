import {
    getUrlParameter,
    updateUrlParameter,
    updatePagination,
    disableSearch,
    enableSearch,
    scrollToTop,
    disablePagination,
} from '../common.js';
import { getExercises, deleteExercise, getExercise } from '../requests.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { renderMessage } from '/js/render.js';
import API from '/js/api.js';

const defaultPage = 0;
const COUNT = 20;
let total = 0;
let currentPage = 0;
let currentQuery;

let jsonExportPage;
let csvExportPage;

const renderCard = (question) => {
    const card = document.createElement('div');
    card.className = 'dashboard-card';

    const info = document.createElement('div');
    info.className = 'dashboard-card__info';
    const infoLabel = document.createElement('div');
    infoLabel.className = 'dashboard-card__label';
    infoLabel.textContent = 'Conținut';
    const infoContent = document.createElement('div');
    infoContent.className = 'dashboard-card__content';
    const infoText = document.createElement('span');
    infoText.textContent = question.text;
    infoContent.appendChild(infoText);

    if (question.image != null) {
        const img = document.createElement('img');
        img.src = question.image;

        infoContent.appendChild(img);
    }

    info.appendChild(infoLabel);
    info.appendChild(infoContent);

    const role = document.createElement('div');
    role.className = 'dashboard-card__role';
    const roleLabel = document.createElement('div');
    roleLabel.className = 'dashboard-card__label';
    roleLabel.textContent = 'Categorie';
    const roleContent = document.createElement('p');
    roleContent.textContent = question.categoryTitle;

    role.appendChild(roleLabel);
    role.appendChild(roleContent);

    const stats = document.createElement('div');
    stats.className = 'dashboard-card__stats';
    const statsLabel = document.createElement('div');
    statsLabel.className = 'dashboard-card__label';
    statsLabel.textContent = 'Opțiuni';
    stats.appendChild(statsLabel);
    const optionList = document.createElement('ul');
    stats.appendChild(optionList);

    question.answers.forEach((answer) => {
        const statRow = document.createElement('li');
        statRow.className = 'dashboard-card__stats__row';
        statRow.textContent = `${answer.description} ${
            answer.correct ? '\u2705' : '\u274C'
        }`;
        optionList.appendChild(statRow);
    });

    const actions = document.createElement('div');
    actions.className = 'dashboard-card__actions';
    const actionsLabel = document.createElement('div');
    actionsLabel.className = 'dashboard-card__label';
    actionsLabel.textContent = 'Acțiuni';

    const modifyButton = document.createElement('a');
    modifyButton.className = 'dashboard-card__action button';
    modifyButton.textContent = 'Modifică întrebarea';
    modifyButton.href = `/dashboard/exercises/${question.id}/edit`;

    const deleteButton = document.createElement('button');
    deleteButton.className = 'dashboard-card__action button';
    deleteButton.textContent = 'Șterge întrebarea';
    deleteButton.onclick = async () => {
        // show confirm modal, then delete, then honestly probably reload the page contents
        const confirmed = await showConfirmModal(
            renderMessage(
                'Sunteți sigur că doriți să ștergeți această întrebare?'
            )
        );
        if (!confirmed) {
            return;
        }

        try {
            await deleteExercise(question.id);
            if (!isNaN(currentQuery) && /^[0-9]+$/.test(currentQuery)) {
                currentQuery = '';
                const searchInput = document.getElementById('search');
                searchInput.value = currentQuery;
                updateUrlParameter('query', '');
            }
            showInfoModal(
                renderMessage('Întrebarea a fost ștearsă cu succes.')
            );
            updatePageContent();
        } catch (e) {
            showInfoModal(renderError(e));
        }
    };

    const exportJSONButton = document.createElement('a');
    exportJSONButton.className = 'dashboard-card__action button';
    exportJSONButton.textContent = 'Exportă ca JSON';

    const jsonString = JSON.stringify(question, null, 2);
    exportJSONButton.href = URL.createObjectURL(
        new Blob([jsonString], { type: `text/json` })
    );
    exportJSONButton.download = `question_${question.id}.json`;

    const exportCSVButton = document.createElement('a');
    exportCSVButton.className = 'dashboard-card__action button';
    exportCSVButton.textContent = 'Exportă ca CSV';
    exportCSVButton.href = new URL(
        `${API.EXERCISES}/exercises/${question.id}?output=csv`
    );

    actions.appendChild(actionsLabel);
    actions.appendChild(modifyButton);
    actions.appendChild(deleteButton);
    actions.appendChild(exportJSONButton);
    actions.appendChild(exportCSVButton);

    card.appendChild(info);
    card.appendChild(role);
    card.appendChild(stats);
    card.appendChild(actions);

    return card;
};

function showData(questions) {
    const container = document.getElementById('dashboard-cards');
    container.innerHTML = '';
    questions.forEach((question) => {
        const card = renderCard(question);
        container.appendChild(card);
    });
}

const setPage = async (page) => {
    currentPage = page;
    updateUrlParameter('page', currentPage);
    await updatePageContent();

    // scrollToTop seems to glitch because the content isn't loaded on the screen yet
    // so we wait a little bit
    const sleep = (ms) => {
        return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
    };
    await sleep(100);

    scrollToTop();
};

const setInitialParams = () => {
    const pageParam = parseInt(getUrlParameter('page'), 10);
    const queryParam = getUrlParameter('query');

    jsonExportPage = document.getElementById('json-export-button');
    csvExportPage = document.getElementById('csv-export-button');

    currentPage = pageParam >= 0 ? pageParam : defaultPage;
    updateUrlParameter('page', currentPage);

    currentQuery = queryParam ? queryParam : undefined;
    if (currentQuery) {
        const searchInput = document.getElementById('search');
        searchInput.value = currentQuery;
    }
};

const currentStart = () => {
    return currentPage * COUNT;
};

const search = async (query) => {
    currentQuery = query;
    updateUrlParameter('query', currentQuery);
    setPage(defaultPage);
    await updatePageContent();
};

async function updatePageContent() {
    let data;
    try {
        disablePagination();
        const responseData = await getExercises(
            currentStart(),
            COUNT,
            currentQuery
        );

        csvExportPage.href = new URL(
            `${
                API.EXERCISES
            }/exercises?start=${currentStart()}&count=${COUNT}&query=${currentQuery}&output=csv`
        );

        data = responseData.data;
        total = responseData.total;

        jsonExportPage.href = URL.createObjectURL(
            new Blob([JSON.stringify(data, null, 2)], { type: `text/json` })
        );

        showData(data);
        updatePagination(currentPage, total, COUNT, setPage);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
        return;
    }
}

const addListenerToSearch = () => {
    const searchInput = document.getElementById('search');

    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', async (e) => {
        const value = searchInput.value;
        e.preventDefault();
        disableSearch();
        await search(value);
        enableSearch();
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    setInitialParams();
    addListenerToSearch();
    await updatePageContent();
});
