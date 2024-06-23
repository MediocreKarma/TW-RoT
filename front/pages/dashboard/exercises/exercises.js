import { getUrlParameter, updateUrlParameter } from '../common.js';
import { getExercises, deleteExercise } from '../requests.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { renderMessage } from '/js/render.js';

const defaultPage = 0;
const COUNT = 20;
let total = 0;
let currentPage = 0;
let currentQuery;
let searchTimeout; // bounce-debounce my beloved

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
        statRow.textContent = `${answer.description} ${answer.correct ? '\u2705' : '\u274C'}`;
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
            showInfoModal(
                renderMessage('Întrebarea a fost ștearsă cu succes.')
            );
            updatePageContent();
        } catch (e) {
            showInfoModal(renderError(e));
        }
    };

    actions.appendChild(actionsLabel);
    actions.appendChild(modifyButton);
    actions.appendChild(deleteButton);

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

const getPaginationRange = (total, count, currentPage) => {
    const totalPages = Math.ceil(total / count);
    if (totalPages === 0) {
        return [
            {
                value: 0,
                selected: true,
            },
        ];
    }

    let range = [];
    let rangeStart = Math.max(0, currentPage - 2);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 2);
    if (rangeEnd - rangeStart < 4) {
        if (rangeStart > 0) {
            rangeStart = Math.max(0, rangeEnd - 4);
        }
        if (rangeEnd < totalPages - 1) {
            rangeEnd = Math.min(totalPages - 1, rangeStart + 4);
        }
    }
    for (let i = rangeStart; i <= rangeEnd; i++) {
        range.push({ value: i, selected: i === currentPage });
    }

    return range;
};

function scrollToTop() {
    document.documentElement.scrollTo({
        top: 0,
        behavior: 'smooth',
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

const updatePagination = (page, total, count) => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const renderPaginationNode = (pageNo, selected, innerText) => {
        const btn = document.createElement('button');
        btn.onclick = async () => {
            btn.disabled = true;
            await setPage(pageNo);
        };
        btn.innerText = innerText ? innerText : pageNo + 1;
        btn.classList.add('button');
        if (selected) {
            btn.classList.add('selected');
            btn.disabled = true;
        }
        return btn;
    };

    paginationContainer.appendChild(renderPaginationNode(0, page === 0, '<<'));
    paginationContainer.appendChild(
        renderPaginationNode(
            Math.max(page - 1, 0),
            page === Math.max(page - 1, 0),
            '<'
        )
    );

    const numbers = getPaginationRange(total, count, page);
    numbers.forEach(({ value, selected }) => {
        paginationContainer.appendChild(renderPaginationNode(value, selected));
    });

    console.log(total + ' ' + count);
    const lastPage = total < count ? 0 : Math.ceil(total / count) - 1;
    console.log(lastPage);

    paginationContainer.appendChild(
        renderPaginationNode(
            Math.max(Math.min(page + 1, lastPage), 0),
            page === Math.max(Math.min(page + 1, lastPage), 0),
            '>'
        )
    );
    paginationContainer.appendChild(
        renderPaginationNode(lastPage, page === lastPage, '>>')
    );
};

const setInitialParams = () => {
    const pageParam = parseInt(getUrlParameter('page'), 10);
    const queryParam = getUrlParameter('query');

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

// irreversible function that disables pagination buttons (to prevent race conditions while loading data)
const disablePagination = () => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.querySelectorAll('button').forEach((button) => {
        button.disabled = true;
    });
};

const setSearchDisabled = (disabled) => {
    const searchInput = document.getElementById('search');
    searchInput.disabled = disabled;
};

// reversible! function that disables search, for same reasons as above
const disableSearch = () => {
    setSearchDisabled(true);
};

// function that enables search, because we're not rebuilding the search elements, they have to be re-enabled
const enableSearch = () => {
    setSearchDisabled(false);
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

        data = responseData.data;
        if (!Array.isArray(data)) {
            data = [data];
        }
        total = responseData.total;

        showData(data);
        updatePagination(currentPage, total, COUNT, currentQuery);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
        return;
    }
}

const addListenerToSearch = () => {
    const searchInput = document.getElementById('search');

    searchInput.addEventListener('input', async () => {
        const value = searchInput.value;

        if (searchTimeout) {
            clearInterval(searchTimeout);
        }
        searchTimeout = setTimeout(async () => {
            disableSearch();
            await search(value);
            enableSearch();
        }, 300);
    });

    const searchForm = document.getElementById('search-form');
    searchForm.addEventListener('submit', async (e) => {
        const value = searchInput.value;
        e.preventDefault();
        if (searchTimeout) {
            clearInterval(searchTimeout);
        }
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
