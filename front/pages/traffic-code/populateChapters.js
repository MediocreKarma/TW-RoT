import { fetchChapters } from './requests.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';

const showChapters = (chapterContainer, chapters) => {
    if (!Array.isArray(chapters)) {
        return;
    }
    chapters.forEach((chapter) => {
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
        const chapters = await fetchChapters();
        showChapters(chapterContainer, chapters);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
});
