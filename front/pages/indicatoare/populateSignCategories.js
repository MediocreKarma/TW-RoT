import { fetchCategory, fetchCategories } from './requests.js';

const showLoading = (domNode) => {
    domNode.innerText = 'Se încarcă...';
};

const renderCategory = (categoryData) => {
    const anchor = document.createElement('a');
    anchor.className = 'category-card';
    anchor.href = `/indicatoare/categorie/${categoryData.id}`;

    const cardBodyDiv = document.createElement('div');
    cardBodyDiv.className = 'category-card__body';

    const img = document.createElement('img');
    img.src = categoryData['image_id'];
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
    showLoading(container);

    const categoriesData = await fetchCategories();
    container.innerHTML = '';

    categoriesData.forEach((category) => {
        container.appendChild(renderCategory(category));
    });
};

window.addEventListener('load', renderCategories);
