import { fetchCategories, fetchCategory } from './requests.js';
import { showLoading, renderMessage } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal, showGeneralModal } from '/js/modals.js';
import { isAdmin } from '/js/auth.js';
import API from '/js/api.js';
import {
    renderCategoryForm,
    categoryFormSubmit,
    populateCategoryForm,
} from './forms.js';

let imgSrc = {}; // use ids as keys

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

    const buttonHolder = document.createElement('div');
    buttonHolder.style.display = 'flex';
    buttonHolder.style.gap = '10px';
    buttonHolder.style['flex-wrap'] = 'wrap';
    buttonHolder.style['justify-content'] = 'center';

    const buttons = [];

    const learnButton = document.createElement('div');
    learnButton.className = 'button';
    learnButton.textContent = 'Învață';
    buttons.push(learnButton);

    buttonHolder.append(learnButton);

    if (isAdmin()) {
        const editButton = document.createElement('div');
        editButton.className = 'button';
        editButton.textContent = 'Editează';

        editButton.onclick = async (e) => {
            e.preventDefault();

            const form = renderCategoryForm();
            try {
                const category = await fetchCategory(categoryData.id);
                populateCategoryForm(form, category);
                const closeModal = showGeneralModal(form);

                form.onsubmit = categoryFormSubmit(
                    closeModal,
                    async (objectFormData) => {
                        console.log(objectFormData);
                        showInfoModal(
                            renderMessage(
                                'Categoria a fost adăugată cu succes.'
                            )
                        );
                    },
                    showCategories
                );
            } catch (e) {
                showInfoModal(renderError(e));
            }
        };

        const deleteButton = document.createElement('div');
        deleteButton.className = 'button';
        deleteButton.textContent = 'Șterge';

        deleteButton.addEventListener('click', () => {
            // try {
            //     await del(`${API.TRAFFIC_SIGNS}/`)
            // }
        });

        buttonHolder.append(editButton, deleteButton);
        buttons.push(editButton, deleteButton);
    }

    for (const button of buttons) {
        button.style.flex = '1';
        button.style['text-align'] = 'center';
        button.style['align-self'] = 'stretch';
        button.style['justify-self'] = '';
    }

    cardBodyDiv.appendChild(img);
    cardBodyDiv.appendChild(title);
    cardBodyDiv.appendChild(buttonHolder);

    anchor.appendChild(cardBodyDiv);

    return anchor;
};

const showCategories = async () => {
    const container = document.getElementById('category-container');
    showLoading(container);
    try {
        const categoriesData = await fetchCategories();
        document.getElementById(
            'csv-export'
        ).href = `${API.TRAFFIC_SIGNS}/sign-categories?output=csv`;
        document.getElementById('json-export').href = URL.createObjectURL(
            new Blob([JSON.stringify(categoriesData, null, 2)], {
                type: `text/json`,
            })
        );

        container.innerHTML = '';

        categoriesData.forEach((category) => {
            container.appendChild(renderCategory(category));
        });

        if (isAdmin()) {
            const newCategory = document.createElement('a');
            newCategory.href = '#';
            newCategory.classList.add('button');
            newCategory.textContent = 'Adaugă o categorie nouă';

            newCategory.onclick = async (e) => {
                e.preventDefault();

                const form = renderCategoryForm();
                const closeModal = showGeneralModal(form);

                form.onsubmit = categoryFormSubmit(
                    closeModal,
                    async (objectFormData) => {
                        console.log(objectFormData);
                        showInfoModal(
                            renderMessage(
                                'Categoria a fost adăugată cu succes.'
                            )
                        );
                    },
                    showCategories
                );
            };

            document.getElementById('button-holder').append(newCategory);
        }
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
};

window.addEventListener('load', showCategories);
