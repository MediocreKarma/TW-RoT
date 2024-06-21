import { fetchChapter, fetchChapters } from './requests.js';
import { showLoading } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';

const showChapter = async (chapterId) => {
    const titleContainer = document.getElementById('chapter-title');
    const contentContainer = document.getElementById('chapter-content');

    showLoading(titleContainer);
    showLoading(contentContainer);

    try {
        const data = await fetchChapter(chapterId);
        titleContainer.innerText = `${
            data.isaddendum ? 'Anexa ' : 'Capitolul '
        } ${data.number}: ${data.title}`;
        contentContainer.innerHTML = data.content;
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

window.addEventListener('load', async () => {
    const chapterId = document.location.pathname
        .replace(/\/+$/, '')
        .split('/')
        .pop();

    await showChapter(chapterId);
    await showChapterSidebar(parseInt(chapterId));
});
