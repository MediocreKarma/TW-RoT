import { deleteChapter, fetchChapters } from './requests.js';
import { renderError } from '/js/errors.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';
import { renderMessage, showLoading } from '/js/render.js';
import { isAdmin } from '/js/auth.js';

const renderChapterCard = (chapter) => {
    const aElement = document.createElement('a');
    aElement.href = `/traffic-code/chapter/${chapter.id}`;

    const divCard = document.createElement('div');
    divCard.className = `chapter-card ${
        chapter.isaddendum ? 'chapter-card--anexa' : ''
    }`;

    const h3Title = document.createElement('h3');
    h3Title.className = 'chapter-card__title';
    h3Title.textContent = `${chapter.isaddendum ? 'Anexa' : 'Capitolul'} ${
        chapter.number
    }`;

    const pDescription = document.createElement('p');
    pDescription.className = 'chapter-card__description';
    pDescription.textContent = chapter.title;

    divCard.appendChild(h3Title);
    divCard.appendChild(pDescription);

    const buttons = document.createElement('div');
    buttons.classList.add('chapter-card__buttons');

    const divButton = document.createElement('div');
    divButton.className = 'button';
    divButton.textContent = 'Învață';

    buttons.appendChild(divButton);

    if (isAdmin()) {
        const editButton = document.createElement('div');
        editButton.className = 'button';
        editButton.textContent = 'Editează';
        editButton.onclick = (e) => {
            e.preventDefault();
            console.log('click');
            // show edit form?? dumnezeu stie
        };

        buttons.appendChild(editButton);

        const deleteButton = document.createElement('div');
        deleteButton.className = 'button';
        deleteButton.textContent = 'Șterge';
        deleteButton.onclick = async (e) => {
            e.preventDefault();

            const confirmed = await showConfirmModal(
                renderMessage(
                    `Sigur doriți să ștergeți capitolul "${chapter.title}"?`
                )
            );
            if (!confirmed) {
                return;
            }

            e.target.disabled = true;

            try {
                await deleteChapter(chapter.id);
                showInfoModal(
                    renderMessage(`Capitolul "${chapter.title}" a fost șters.`)
                );
                fetchAndShowChapters();
            } catch (e) {
                showInfoModal(renderError(e));
            }
        };

        buttons.appendChild(deleteButton);
    }

    divCard.appendChild(buttons);

    aElement.appendChild(divCard);

    return aElement;
};

const showChapters = (chapters) => {
    const chapterContainer = document.getElementById('chapters-container');
    showLoading(chapterContainer);
    if (!Array.isArray(chapters)) {
        return;
    }
    chapterContainer.innerHTML = '';
    chapters.forEach((chapter) => {
        chapterContainer.appendChild(renderChapterCard(chapter));
    });
};

const fetchAndShowChapters = async () => {
    if (isAdmin()) {
        const addChapters = document.createElement('button');
        addChapters.type = 'button';
        addChapters.classList.add('button', 'cod-rutier__button');
        addChapters.id = 'chapters-add';
        addChapters.textContent = 'Adaugă un capitol nou';
        const title = document.getElementById('cod-rutier__title');
        title.parentNode.insertBefore(addChapters, title.nextElementSibling);
    }

    try {
        const chapters = await fetchChapters();
        showChapters(chapters);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
};

window.addEventListener('load', fetchAndShowChapters);
