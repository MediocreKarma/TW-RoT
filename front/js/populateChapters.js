import { API_URL } from './constants.js';

const renderChapters = (chapterContainer, chapters) => {
    if (!Array.isArray(chapters)) {
        return;
    }
    chapters.forEach((chapter) => {
        const aElement = document.createElement('a');
        aElement.href = `capitole/capitol_${chapter.number}.html`;

        const divCard = document.createElement('div');
        divCard.className = 'chapter-card';

        const h3Title = document.createElement('h3');
        h3Title.className = 'chapter-card__title';
        h3Title.textContent = `Capitolul ${chapter.number}`;

        const pDescription = document.createElement('p');
        pDescription.className = 'chapter-card__description';
        pDescription.textContent = chapter.title;

        const divButton = document.createElement('div');
        divButton.className = 'button';
        divButton.textContent = 'Învață';

        divCard.appendChild(h3Title);
        divCard.appendChild(pDescription);
        divCard.appendChild(divButton);

        aElement.appendChild(divCard);

        chapterContainer.appendChild(aElement);
    });
};

window.addEventListener('load', async () => {
    const chapterContainer = document.getElementById('chapters-container');

    try {
        const chapterRequest = await fetch(`${API_URL}/chapters`);
        const chapters = await chapterRequest.json();

        renderChapters(chapterContainer, chapters);
    } catch (e) {
        // TODO: proper error handling using error codes :)
        console.log(e);
        chapterContainer.textContent = `Ne pare rău! A intervenit o eroare: ${Object.toString(
            e
        )}`;
        return;
    }
});
