const API_URL = 'http://localhost:12734/api/v1';

const fetchChapter = async (id) => {
    const response = await fetch(`${API_URL}/chapters/${id}`);
    const data = await response.json();
    return data;
};

const fetchChapters = async () => {
    const response = await fetch(`${API_URL}/chapters`);
    const data = await response.json();
    return data;
};

const showLoading = (domNode) => {
    domNode.innerText = 'Se încarcă...';
};

const populateChapterContent = async (chapterId) => {
    const titleContainer = document.getElementById('chapter-title');
    const contentContainer = document.getElementById('chapter-content');

    showLoading(titleContainer);
    showLoading(contentContainer);

    const data = await fetchChapter(chapterId);
    titleContainer.innerText = `${data.isaddendum ? 'Anexa ' : 'Capitolul '} ${
        data.number
    }: ${data.title}`;

    contentContainer.innerHTML = data.content;
};

const populateChapterSidebar = async (currentId) => {
    const sidebar = document.getElementById('chapter-sidebar');
    showLoading(sidebar);

    const data = await fetchChapters();

    data.forEach((chapter) => {
        const a = document.createElement('a');
        a.href = `./capitol.html?id=${chapter.id}`;

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
    const chapterId = new URLSearchParams(document.location.search).get('id');

    await populateChapterContent(chapterId);
    await populateChapterSidebar(parseInt(chapterId));
});
