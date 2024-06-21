import { getLeaderboardUsers, getRSSLink } from './requests.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';
import { renderMessage } from '/js/render.js';

const defaultPage = 0;
const defaultCount = 5;
let total = 0;
let currentPage = 0;
const initialCount = defaultCount;

async function showLeaderboardUsers(start, count) {
    const leaderboardTable = document.getElementById('leaderboard-table');
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    const users = await getLeaderboardUsers(start, count);
    const { data, total: totalUsers } = users;

    leaderboardTable.innerHTML = '';

    total = totalUsers;

    data.forEach((user, index) => {
        const row = document.createElement('tr');

        appendCell(row, start + index + 1 + '.');
        appendCell(row, user.username);
        appendCell(
            row,
            (user.totalQuestions === 0
                ? 0
                : (user.solvedQuestions / user.totalQuestions) * 100
            ).toFixed(2) + '%'
        );
        appendCell(row, user.solvedQuestions);
        appendCell(row, user.totalQuestionnaires);

        leaderboardTable.appendChild(row);
    });

    updatePagination(prevButton, nextButton, start, count);
    updateUrlParameters(currentPage);
}

function appendCell(row, textContent) {
    const cell = document.createElement('td');
    cell.textContent = textContent;
    row.appendChild(cell);
}

function updatePagination(prevButton, nextButton, start, count) {
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = start + count >= total;
}

function updateUrlParameters(page) {
    const queryParams = new URLSearchParams(window.location.search);
    queryParams.set('page', page);
    history.replaceState(null, null, '?' + queryParams.toString());
}

function getUrlParameter(name) {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(name);
}

function renderRSSContainer(link) {
    function copyToClipboard(text) {
        navigator.clipboard
            .writeText(text)
            .then(() => {
                showInfoModal(
                    renderMessage('Link-ul a fost copiat în clipboard.')
                );
            })
            .catch((err) => {
                console.error('Failed to copy link: ', err);
            });
    }
    const container = document.createElement('div');
    container.className = 'rss-container';

    const message = document.createElement('p');
    message.textContent = 'Feed-ul RSS este disponibil la:';
    container.appendChild(message);

    const linkParagraph = document.createElement('p');
    const rssLink = document.createElement('a');
    rssLink.href = link;
    rssLink.className = 'rss-link';
    rssLink.id = 'rssLink';
    rssLink.textContent = link;
    linkParagraph.appendChild(rssLink);
    container.appendChild(linkParagraph);

    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('modal__buttons');
    const copyButton = document.createElement('button');
    copyButton.className = 'copy-button';
    copyButton.textContent = 'Copiază link-ul';
    copyButton.onclick = function () {
        copyToClipboard(rssLink.href);
    };
    buttonContainer.appendChild(copyButton);
    container.appendChild(buttonContainer);

    return container;
}

window.addEventListener('load', async () => {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');
    const exportButton = document.getElementById('export');

    try {
        const param = parseInt(getUrlParameter('page'), 10);

        currentPage = param >= 0 ? param : defaultPage;
        const initialStart = currentPage * initialCount;
        await showLeaderboardUsers(initialStart, initialCount);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/exercises';
        });
    }

    prevButton.addEventListener('click', async () => {
        if (currentPage > 0) {
            currentPage--;
            const newStart = currentPage * initialCount;
            try {
                await showLeaderboardUsers(newStart, initialCount);
            } catch (e) {
                showInfoModal(renderError(e), () => {
                    window.location.href = '/exercises';
                });
            }
        }
    });

    nextButton.addEventListener('click', async () => {
        const totalPages = Math.ceil(total / initialCount);
        if (currentPage < totalPages - 1) {
            currentPage++;
            const newStart = currentPage * initialCount;
            try {
                await showLeaderboardUsers(newStart, initialCount);
            } catch (e) {
                showInfoModal(renderError(e), () => {
                    window.location.href = '/exercises';
                });
            }
        }
    });

    exportButton.addEventListener('click', async () => {
        showInfoModal(renderRSSContainer(getRSSLink()));
    });
});
