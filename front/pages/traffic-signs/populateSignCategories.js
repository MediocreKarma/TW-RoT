import { fetchCategories } from './requests.js';
import { setLoading } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';

const renderCategory = (categoryData) => {
    const anchor = document.createElement('a');
    anchor.className = 'category-card';
    anchor.href = `/traffic-signs/category/${categoryData.id}`;

    const cardBodyDiv = document.createElement('div');
    cardBodyDiv.className = 'category-card__body';

    const img = document.createElement('img');
    img.src = categoryData['image'];
    img.alt = categoryData.title;
    img.className = 'category-card__img';

    const title = document.createElement('h3');
    title.className = 'category-card__title';
    title.textContent = categoryData.title;

    const button = document.createElement('div');
    button.className = 'button';
    button.textContent = 'Învață';

    cardBodyDiv.appendChild(img);
    cardBodyDiv.appendChild(title);
    cardBodyDiv.appendChild(button);

    anchor.appendChild(cardBodyDiv);

    return anchor;
};

const renderCategories = async () => {
    const container = document.getElementById('category-container');
    setLoading(container);
    try {
        const categoriesData = await fetchCategories();
        container.innerHTML = '';

        categoriesData.forEach((category) => {
            container.appendChild(renderCategory(category));
        });
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
};

window.addEventListener('load', renderCategories);
