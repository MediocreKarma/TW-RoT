import {
    deleteChapter,
    fetchChapters,
    getChapter,
    getChaptersCSV,
    patchChapter,
    postChapter,
} from './requests.js';
import { renderError } from '/js/errors.js';
import {
    showInfoModal,
    showConfirmModal,
    showGeneralModal,
} from '/js/modals.js';
import { renderMessage, showLoading } from '/js/render.js';
import { isAdmin } from '/js/auth.js';
import { showFormError } from '/js/form/errors.js';
import { validateForm } from '/js/form/validate.js';
import {
    renderChapterForm,
    chapterFormSubmit,
    populateChapterForm,
} from './chapterForm.js';

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
        editButton.onclick = async (e) => {
            e.preventDefault();

            const form = renderChapterForm();
            editButton.disabled = true;

            const chapterData = await getChapter(chapter.id);
            populateChapterForm(form, chapterData);
            const closeModal = showGeneralModal(form);
            form.addEventListener(
                'submit',
                chapterFormSubmit(
                    closeModal,
                    async (objectFormData) => {
                        await patchChapter(chapter.id, objectFormData);
                        showInfoModal(
                            renderMessage(
                                'Capitolul a fost modificat cu succes.'
                            )
                        );
                    },
                    fetchAndShowChapters
                )
            );
            editButton.disabled = false;
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
    if (!Array.isArray(chapters)) {
        return;
    }
    chapterContainer.innerHTML = '';
    chapters.forEach((chapter) => {
        chapterContainer.appendChild(renderChapterCard(chapter));
    });
};

const setAdminButtons = (chapterData) => {
    if (!isAdmin()) {
        return;
    }
    const buttons = document.getElementById('chapters-buttons');
    let exportJSONButton = buttons.querySelector('#json-export');
    if (!exportJSONButton) {
        exportJSONButton = document.createElement('a');
        exportJSONButton.className = 'button';
        exportJSONButton.href = '';
        exportJSONButton.textContent = 'Exportează ca JSON';
        buttons.appendChild(exportJSONButton);
    }
    const jsonString = JSON.stringify(chapterData, null, 2);
    exportJSONButton.href = URL.createObjectURL(
        new Blob([jsonString], { type: `text/json` })
    );
    exportJSONButton.download = `chapters.json`;

    let exportCSVButton = buttons.querySelector('#csv-export');
    if (!exportCSVButton) {
        exportCSVButton = document.createElement('a');
        exportCSVButton.className = 'dashboard-card__action button';
        exportCSVButton.textContent = 'Exportează ca CSV';
        buttons.appendChild(exportCSVButton);
    }
    exportCSVButton.href = getChaptersCSV();
};

const fetchAndShowChapters = async () => {
    try {
        const chapters = await fetchChapters();
        setAdminButtons(chapters);
        showChapters(chapters);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
};

window.addEventListener('load', fetchAndShowChapters);
