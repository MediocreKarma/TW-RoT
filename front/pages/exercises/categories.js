import { getExerciseCategories } from './requests.js';
import { renderMessage, showLoading } from '/js/render.js';

const renderCategory = (categoryData) => {
    const anchor = document.createElement('a');
    anchor.href = `/exercises/category/${categoryData.id}`;

    const percentage =
        categoryData['total'] === 0
            ? 0
            : (categoryData['solved'] / categoryData['total']) * 100;

    const cardDiv = document.createElement('div');
    cardDiv.className = 'question-category';

    const fillerDiv = document.createElement('div');
    fillerDiv.className = 'question-category__filler';
    fillerDiv.style.width = percentage + '%';

    const titleParagraph = document.createElement('p');
    titleParagraph.className = 'question-category__title';
    titleParagraph.textContent = categoryData.title;

    const valueParagraph = document.createElement('p');
    valueParagraph.className = 'question-category__value';
    valueParagraph.textContent = `${categoryData['solved']}/${categoryData['total']}`;

    cardDiv.appendChild(fillerDiv);
    cardDiv.appendChild(titleParagraph);
    cardDiv.appendChild(valueParagraph);

    anchor.appendChild(cardDiv);

    return anchor;
};

const showIncorrectData = async (wrong) => {
    document
        .getElementById('incorrectly-solved')
        .querySelector('.question-category__value').innerText = wrong;
};

const showCategories = async () => {
    const container = document.getElementById('categories');
    showLoading(container);

    const categoriesData = await getExerciseCategories();
    console.log(categoriesData);
    container.innerHTML = '';

    categoriesData.categories.forEach((category) => {
        container.appendChild(renderCategory(category));
    });

    showIncorrectData(categoriesData.wrong);
};

window.addEventListener('load', showCategories);
