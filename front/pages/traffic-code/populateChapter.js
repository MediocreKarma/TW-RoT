import {
    fetchChapter,
    fetchChapters,
    patchChapter,
    getChapterCSV,
} from './requests.js';
import { showLoading, renderMessage } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal, showGeneralModal } from '/js/modals.js';
import { isAdmin } from '/js/auth.js';
import {
    renderChapterForm,
    populateChapterForm,
    chapterFormSubmit,
} from './chapterForm.js';

const setTopButtons = (chapter) => {
    const buttons = document.getElementById('chapter-buttons');

    let exportJSONButton = buttons.querySelector('#json-export');
    if (exportJSONButton) {
        const jsonString = JSON.stringify(chapter, null, 2);
        exportJSONButton.href = URL.createObjectURL(
            new Blob([jsonString], { type: `text/json` })
        );
        exportJSONButton.download = `chapter_${chapter.id}.json`;
    }

    let exportCSVButton = buttons.querySelector('#csv-export');
    if (exportCSVButton) {
        exportCSVButton.href = getChapterCSV(chapter.id);
    }

    if (!isAdmin()) {
        return;
    }

    let editChapter = buttons.querySelector('#chapter-edit');
    if (!editChapter) {
        editChapter = document.createElement('button');
        editChapter.type = 'button';
        editChapter.className = 'button';
        editChapter.id = 'chapter-edit';
        editChapter.textContent = 'Editează';
        buttons.appendChild(editChapter);
    }

    editChapter.onclick = async (e) => {
        e.preventDefault();

        const form = renderChapterForm();
        editChapter.disabled = true;

        populateChapterForm(form, chapter);

        const closeModal = showGeneralModal(form);
        form.onsubmit = chapterFormSubmit(
            closeModal,
            async (objectFormData) => {
                await patchChapter(chapter.id, objectFormData);
                showInfoModal(
                    renderMessage('Capitolul a fost editat cu succes.')
                );
            },
            fetchAndShowChapter
        );
        editChapter.disabled = false;
    };
};

const showChapter = async (chapterId) => {
    const titleContainer = document.getElementById('chapter-title');
    const contentContainer = document.getElementById('chapter-content');

    showLoading(titleContainer);
    showLoading(contentContainer);

    try {
        const data = await fetchChapter(chapterId);
        data.id = parseInt(chapterId, 10);
        titleContainer.innerText = `${
            data.isaddendum ? 'Anexa ' : 'Capitolul '
        } ${data.number}: ${data.title}`;
        contentContainer.innerHTML = data.content;

        setTopButtons(data);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/traffic-code';
        });
    }
};

const showChapterSidebar = async (currentId) => {
    const sidebar = document.getElementById('chapter-sidebar');
    if (!sidebar) {
        return;
    }
    showLoading(sidebar);

    let data;
    try {
        data = await fetchChapters();
    } catch (e) {
        // don't even show sidebar
        sidebar.innerText = '';
        return;
    }

    sidebar.innerText = '';

    data.forEach((chapter) => {
        const a = document.createElement('a');
        a.href = `/traffic-code/chapter/${chapter.id}`;

        const div = document.createElement('div');
        div.className = 'chapter-sidebar__item';
        if (chapter.id === currentId) {
            div.classList.add('chapter-sidebar__item--checked');
        }
        div.textContent = chapter.title;

        a.appendChild(div);

        sidebar.appendChild(a);
    });
};

const fetchAndShowChapter = async () => {
    const chapterId = document.location.pathname
        .replace(/\/+$/, '')
        .split('/')
        .pop();

    await showChapter(chapterId);
    await showChapterSidebar(parseInt(chapterId));
};

window.addEventListener('load', fetchAndShowChapter);
