import {
    getUrlParameter,
    updateUrlParameter,
    updatePagination,
    disablePagination,
    scrollToTop,
    disableSearch,
    enableSearch,
} from '../common.js';
import {
    deleteUserProgress,
    deleteUser,
    getUsers,
    patchBanUser,
    changeUserEmail,
} from '../requests.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { renderMessage, showLoading } from '/js/render.js';
import { isAdmin, isBanned } from '/js/auth.js';

const defaultPage = 0;
const COUNT = 20;
let total = 0;
let currentPage = 0;
let currentQuery;

const renderEmailForm = () => {
    const form = document.createElement('form');

    const group = document.createElement('div');
    group.classList.add('form__group');

    const emailLabel = document.createElement('label');
    emailLabel.innerText = 'Email';

    const emailField = document.createElement('input');
    emailField.type = 'email';
    emailField.name = 'email';
    emailField.classList.add('form__input');

    const buttons = document.createElement('div');
    buttons.classList.add('form__buttons');

    // const cancel = document.createElement('button');
    // cancel.innerText = 'Anulează';

    const confirm = document.createElement('button');
    confirm.innerText = 'Confirmă';
    confirm.type = 'submit';

    buttons.append(confirm);

    group.append(emailLabel);
    group.append(emailField);

    form.append(group, buttons);

    return form;
};

function renderCard(user) {
    const card = document.createElement('div');
    card.classList.add('dashboard-card');

    const banned = isBanned(user.flags);
    const admin = isAdmin(user.flags);

    const infoSection = document.createElement('div');
    infoSection.classList.add('dashboard-card__info');
    const userLabel = document.createElement('div');
    userLabel.classList.add('dashboard-card__label');
    userLabel.textContent = 'Utilizator';
    const username = document.createElement('div');
    username.classList.add('dashboard-card__username');
    username.textContent = `@${user.username}`;
    const email = document.createElement('div');
    email.classList.add('dashboard-card__email');
    email.textContent = user.email;
    infoSection.append(userLabel, username, email);

    const roleSection = document.createElement('div');
    roleSection.classList.add('dashboard-card__role');
    const roleLabel = document.createElement('div');
    roleLabel.classList.add('dashboard-card__label');
    roleLabel.textContent = 'Rol';
    const role = document.createElement('p');
    role.textContent = isBanned(user.flags)
        ? 'Restricționat'
        : isAdmin(user.flags)
        ? 'Administrator'
        : 'Utilizator';
    roleSection.append(roleLabel, role);

    const correctQuestionsPercentage = (
        user.totalQuestions === 0
            ? 0
            : (user.solvedQuestions / user.totalQuestions) * 100
    ).toFixed(2);

    const statsSection = document.createElement('div');
    statsSection.classList.add('dashboard-card__stats');
    const statsLabel = document.createElement('div');
    statsLabel.classList.add('dashboard-card__label');
    statsLabel.textContent = 'Statistici';
    const statList = document.createElement('ul');
    const correctPercentage = document.createElement('li');
    correctPercentage.classList.add('dashboard-card__stats__row');
    correctPercentage.innerHTML = `% întrebări corecte: <span>${correctQuestionsPercentage}%</span>`;
    const correctAnswers = document.createElement('li');
    correctAnswers.classList.add('dashboard-card__stats__row');
    correctAnswers.innerHTML = `Nr. răspunsuri corecte: <span>${user.solvedQuestions}</span>`;
    const completedQuestionnaires = document.createElement('li');
    completedQuestionnaires.classList.add('dashboard-card__stats__row');
    completedQuestionnaires.innerHTML = `Nr. chestionare admise: <span>${user.solvedQuestionnaires}</span>`;
    statList.append(correctPercentage, correctAnswers, completedQuestionnaires);
    statsSection.append(statsLabel, statList);

    const actionsSection = document.createElement('div');
    actionsSection.classList.add('dashboard-card__actions');
    const actionsLabel = document.createElement('div');
    actionsLabel.classList.add('dashboard-card__label');
    actionsLabel.textContent = 'Acțiuni';
    if (admin) {
        const unavailableText = document.createElement('p');
        unavailableText.innerHTML =
            'Indisponibile pentru un cont de administrator';
        actionsSection.append(unavailableText);
    } else {
        const restrictButton = document.createElement('button');
        restrictButton.classList.add('dashboard-card__action', 'button');
        restrictButton.textContent = !banned
            ? 'Restricționează'
            : 'Scoate restricționare';
        restrictButton.onclick = async () => {
            const banned = isBanned(user.flags); // shadow upper banned :)

            const confirmed = await showConfirmModal(
                renderMessage(
                    `Sunteți sigur că doriți să ${
                        !banned
                            ? 'restricționați utilizatorul'
                            : 'scoateți restricționarea utilizatorului'
                    } ${user.username}?`
                )
            );
            if (!confirmed) {
                return;
            }

            try {
                await patchBanUser(user.id, !banned);
                showInfoModal(
                    renderMessage(
                        !banned
                            ? `Utilizatorul ${user.username} a fost restricționat cu succes.`
                            : `Utilizatorul ${user.username} nu mai este restricționat.`
                    )
                );
            } catch (e) {
                showInfoModal(renderError(e));
            }
            updatePageContent();
        };

        const resetButton = document.createElement('button');
        resetButton.classList.add('dashboard-card__action', 'button');
        resetButton.textContent = 'Resetează progres';

        resetButton.onclick = async () => {
            const confirmed = await showConfirmModal(
                renderMessage(
                    `Sunteți sigur că doriți să resetați progresul utilizatorului ${user.username}?`
                )
            );
            if (!confirmed) {
                return;
            }
            try {
                await deleteUserProgress(user.id);
                showInfoModal(
                    renderMessage(
                        `Progresul utilizatorului ${user.username} a fost resetat.`
                    )
                );
            } catch (e) {
                showInfoModal(renderError(e));
            }
            updatePageContent();
        };

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('dashboard-card__action', 'button');
        deleteButton.textContent = 'Șterge contul';

        deleteButton.onclick = async () => {
            const confirmed = await showConfirmModal(
                renderMessage(
                    `Sunteți sigur că doriți să ștergeți contul utilizatorului ${user.username}?`
                )
            );
            if (!confirmed) {
                return;
            }
            try {
                await deleteUser(user.id);
                showInfoModal(
                    renderMessage(
                        `Contul utilizatorului ${user.username} a fost șters.`
                    )
                );
            } catch (e) {
                showInfoModal(renderError(e));
            }
            updatePageContent();
        };

        const changeEmailButton = document.createElement('button');
        changeEmailButton.classList.add('dashboard-card__action', 'button');
        changeEmailButton.textContent = 'Schimbă email';

        changeEmailButton.onclick = async () => {
            const form = renderEmailForm();
            const closeModal = showInfoModal(form);

            const onFormSubmit = async (e) => {
                e.preventDefault();
                form.querySelector('button[type=submit]').disabled = true;

                const formData = new FormData(form);
                const email = formData.get('email');

                try {
                    // change credentials
                    await changeUserEmail(user.id, email);
                    showInfoModal(
                        renderMessage(
                            `A fost trimis un email de confirmare pe adresa ${email}.`
                        )
                    );
                } catch (e) {
                    showInfoModal(renderError(e));
                    form.querySelector('button[type=submit]').disabled = false;
                    return;
                }

                closeModal();
                updatePageContent();
            };

            form.addEventListener('submit', onFormSubmit);
        };

        actionsSection.append(
            actionsLabel,
            restrictButton,
            resetButton,
            deleteButton,
            changeEmailButton
        );
    }

    card.append(infoSection, roleSection, statsSection, actionsSection);

    return card;
}

function showLoadingData() {
    const container = document.getElementById('dashboard-cards');
    showLoading(container);
}

function showData(users) {
    const container = document.getElementById('dashboard-cards');
    container.innerHTML = '';
    users.forEach((user) => {
        const card = renderCard(user);
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
        showLoadingData();
        const responseData = await getUsers(
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
