import {
    fetchComparisonCategories,
    fetchComparisonSignsInCategory,
    fetchComparisonOfSignInCategory,
} from './requests.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';

const DEFAULT_ID = 'default';
const CATEGORY_ID_ATTR = '__category-id';

const populateSelect = (select, values) => {
    const renderOption = ({ id, title }) => {
        const option = document.createElement('option');
        option.setAttribute('value', `${id}`);
        option.innerText = title;

        return option;
    };

    select.innerHTML = '';
    select.appendChild(
        renderOption({ id: DEFAULT_ID, title: 'Selectează...' })
    );

    values.forEach((value) => {
        select.appendChild(renderOption(value));
    });
};

const renderCard = (sign) => {
    const compareCardDiv = document.createElement('div');
    compareCardDiv.className = 'compare-card';

    const imgElement = document.createElement('img');
    imgElement.src = sign.image;
    imgElement.alt = `Varianta din ${sign.country} a semnului de circulație`;

    const h3Element = document.createElement('h3');
    h3Element.textContent = sign.country;

    compareCardDiv.appendChild(imgElement);
    compareCardDiv.appendChild(h3Element);

    return compareCardDiv;
};

const populateComparisonCategories = async () => {
    try {
        const categories = await fetchComparisonCategories();

        let comparisonCategorySelect = document.getElementById(
            'comparison-category'
        );
        let comparisonSignSelect = document.getElementById('comparison-sign');

        populateSelect(comparisonCategorySelect, categories);

        comparisonCategorySelect.addEventListener(
            'change',
            async () => {
                if (comparisonCategorySelect.value == DEFAULT_ID) {
                    comparisonSignSelect.parentElement.style['display'] =
                        'none';
                    return;
                }
                try {
                    const categorySigns = await fetchComparisonSignsInCategory(
                        comparisonCategorySelect.value
                    );
                    populateSelect(comparisonSignSelect, categorySigns);
                    comparisonSignSelect.parentElement.style['display'] =
                        'block';
                    comparisonSignSelect.setAttribute(
                        CATEGORY_ID_ATTR,
                        `${comparisonCategorySelect.value}`
                    );
                } catch (e) {
                    showInfoModal(renderError(e));
                }
            },
            false
        );

        comparisonSignSelect.addEventListener(
            'change',
            async () => {
                let targetSign = document.getElementById('comparison-target');
                let results = document.getElementById('comparison-results');

                if (comparisonCategorySelect.value == DEFAULT_ID) {
                    targetSign.style['display'] = 'none';
                    results.style['display'] = 'none';
                    return;
                }
                try {
                    let signVariants = await fetchComparisonOfSignInCategory(
                        comparisonCategorySelect.value,
                        comparisonSignSelect.value
                    );

                    const isRomanianVariant = (sign) =>
                        sign.country === 'România' ||
                        sign.country === 'Romania';

                    const romanianSign =
                        signVariants.find(isRomanianVariant) || null;

                    if (romanianSign) {
                        targetSign.innerHTML = '';
                        targetSign.appendChild(renderCard(romanianSign));
                        targetSign.style['display'] = 'flex';
                    }

                    signVariants = signVariants.filter(
                        (sign) =>
                            sign.imageId !== null &&
                            sign.imageId !== 'null' &&
                            !isRomanianVariant(sign)
                    );

                    results.innerHTML = '';
                    signVariants.forEach((sign) => {
                        results.appendChild(renderCard(sign));
                    });
                    results.style['display'] = 'flex';

                    comparisonSignSelect.parentElement.style['display'] =
                        'block';
                    comparisonSignSelect.setAttribute(
                        CATEGORY_ID_ATTR,
                        `${comparisonCategorySelect.value}`
                    );
                } catch (e) {
                    showInfoModal(renderError(e));
                }
            },
            false
        );
    } catch (e) {
        // redirect to traffic-signs because there's nothing to do, really
        showInfoModal(renderError(e), () => {
            window.location.href = '/traffic-signs';
        });
    }
};

window.addEventListener(
    'load',
    async () => {
        await populateComparisonCategories();
    },
    false
);
