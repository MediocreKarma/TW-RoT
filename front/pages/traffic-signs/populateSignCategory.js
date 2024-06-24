import { fetchCategory } from './requests.js';
import { showInfoModal, showGeneralModal } from '/js/modals.js';
import { showLoading } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { isAdmin } from '/js/auth.js';
import { renderSignForm } from './forms.js';
import API from '/js/api.js';

let imgSrc = {}; // use ids as keys

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

const showCards = (targetNode, cardsData) => {
    targetNode.innerHTML = '';

    cardsData.forEach((cardData) => {
        targetNode.appendChild(renderCard(cardData));
    });
};

const showInfo = (targetNode, categoryInfo) => {
    const attributeMapping = new Map([
        ['Aspect', 'design'],
        ['Rol', 'purpose'],
        ['Sugestii', 'suggestion'],
    ]);
    console.log(categoryInfo);
    targetNode.querySelectorAll('.category-info__row').forEach((row) => {
        const keyElement = row.querySelector('.category-info__key');
        const valueElement = row.querySelector('.category-info__value');
        if (keyElement && valueElement) {
            try {
                const key = keyElement.textContent.trim();
                valueElement.innerText =
                    categoryInfo[attributeMapping.get(key)];
            } catch (err) {
                valueElement.innerText = 'Nu s-a putut încărca informația';
            }
        }
    });
};

const showCategory = async () => {
    const id = document.location.pathname.replace(/\/+$/, '').split('/').pop();

    const container = document.getElementById('category-container');
    showLoading(container);

    const title = document.getElementById('sign-category-title');
    showLoading(title);

    const info = document.getElementById('category-info');

    info.querySelectorAll('.category-info__value').forEach((value) => {
        showLoading(value);
    });

    try {
        const categoryData = await fetchCategory(id);
        title.innerText = categoryData.category.title;

        document.getElementById('csv-export').href = 
            `${API.TRAFFIC_SIGNS}/sign-categories?output=csv`;
        
        document.getElementById('json-export').href = URL.createObjectURL(
            new Blob([JSON.stringify(categoryData, null, 2)], { type: `text/json` })
        );

        showInfo(info, categoryData.category);
        showCards(container, categoryData.signs);
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/traffic-signs';
        });
    }
};

window.addEventListener('load', showCategory);
