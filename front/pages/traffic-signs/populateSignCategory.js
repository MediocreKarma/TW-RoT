import { fetchCategory } from './requests.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';
import { setLoading } from '/js/render.js';

function renderCard(cardData) {
    // Create the main card div
    const cardDiv = document.createElement('div');
    cardDiv.className = 'category-card';

    // Create the card body div
    const cardBodyDiv = document.createElement('div');
    cardBodyDiv.className = 'category-card__body';

    // Create the image element
    const img = document.createElement('img');
    img.src = cardData['image'];
    img.alt = cardData.title;
    img.className = 'card-img mb-2';

    // Create the title element
    const title = document.createElement('h2');
    title.className = 'card-title';
    title.style.lineHeight = '1.2';
    title.textContent = cardData.title;

    // Create the paragraph element
    const paragraph = document.createElement('p');
    paragraph.textContent = cardData.description;
    // Append the image, title, and paragraph to the card body
    cardBodyDiv.appendChild(img);
    cardBodyDiv.appendChild(title);
    cardBodyDiv.appendChild(paragraph);

    // Append the card body to the main card div
    cardDiv.appendChild(cardBodyDiv);
    return cardDiv;
}

const renderCards = (targetNode, cardsData) => {
    targetNode.innerHTML = '';

    cardsData.forEach((cardData) => {
        targetNode.appendChild(renderCard(cardData));
    });
};

const renderCategory = async () => {
    const id = document.location.pathname.replace(/\/+$/, '').split('/').pop();

    const container = document.getElementById('category-container');
    setLoading(container);

    const title = document.getElementById('sign-category-title');
    setLoading(title);

    try {
        const categoryData = await fetchCategory(id);
        renderCards(container, categoryData.signs);
        title.innerText = categoryData.category.title;
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/traffic-signs';
        });
    }
};

window.addEventListener('load', renderCategory);
