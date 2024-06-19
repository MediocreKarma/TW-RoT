import { fetchChapter, fetchChapters } from './requests.js';

import { showError } from '/js/errors.js';

const showLoading = (domNode) => {
    domNode.innerText = 'Se încarcă...';
};

const populateChapterContent = async (chapterId) => {
    const titleContainer = document.getElementById('chapter-title');
    const contentContainer = document.getElementById('chapter-content');

    showLoading(titleContainer);
    showLoading(contentContainer);

    try {
        const data = await fetchChapter(chapterId);
        console.log(data);
        titleContainer.innerText = `${
            data.isaddendum ? 'Anexa ' : 'Capitolul '
        } ${data.number}: ${data.title}`;
        contentContainer.innerHTML = data.content;
    } catch (e) {
        showError(e);
    }
};

const populateChapterSidebar = async (currentId) => {
    const sidebar = document.getElementById('chapter-sidebar');
    if (!sidebar) {
        return;
    }
    showLoading(sidebar);

    const data = await fetchChapters();

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
    // const chapterId = new URLSearchParams(document.location.search).get('id');
    const chapterId = document.location.pathname
        .replace(/\/+$/, '')
        .split('/')
        .pop();

    await populateChapterContent(chapterId);
    await populateChapterSidebar(parseInt(chapterId));
});
