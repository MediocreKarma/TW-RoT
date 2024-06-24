import { setProperty, setValue } from '/js/form/utils.js';
import { renderError } from '/js/errors.js';
import { signCategoryFormInnerHtml, signFormInnerHtml } from './formText.js';
import {
    showInfoModal,
    showConfirmModal,
    showGeneralModal,
} from '/js/modals.js';
import { showFormError } from '/js/form/errors.js';
import { validateForm } from '/js/form/validate.js';
import { disableFormSubmit, enableFormSubmit } from '/js/form/utils.js';

export const renderCategoryForm = () => {
    const form = document.createElement('form');
    form.classList.add('form');
    const titleGroup = document.createElement('div');
    titleGroup.classList.add('form__group');
    const titleLabel = document.createElement('label');
    titleLabel.setAttribute('for', 'title');
    titleLabel.innerText = 'Titlu';
    const titleField = document.createElement('input');
    titleField.type = 'text';
    titleField.id = 'title';
    titleField.name = 'title';
    titleField.classList.add('form__input');
    titleGroup.append(titleLabel, titleField);

    const designGroup = document.createElement('div');
    designGroup.classList.add('form__group');
    const designLabel = document.createElement('label');
    designLabel.setAttribute('for', 'design');
    designLabel.innerText = 'Aspect';
    const designField = document.createElement('textarea');
    designField.id = 'design';
    designField.name = 'design';
    designField.rows = 2;
    designField.classList.add('form__input');
    designGroup.append(designLabel, designField);

    const purposeGroup = document.createElement('div');
    purposeGroup.classList.add('form__group');
    const purposeLabel = document.createElement('label');
    purposeLabel.setAttribute('for', 'purpose');
    purposeLabel.innerText = 'Scop';
    const purposeField = document.createElement('textarea');
    purposeField.id = 'purpose';
    purposeField.name = 'purpose';
    purposeField.rows = 2;
    purposeField.classList.add('form__input');
    purposeGroup.append(purposeLabel, purposeField);

    const suggestionGroup = document.createElement('div');
    suggestionGroup.classList.add('form__group');
    const suggestionLabel = document.createElement('label');
    suggestionLabel.setAttribute('for', 'suggestion');
    suggestionLabel.innerText = 'Sugestii';
    const suggestionField = document.createElement('textarea');
    suggestionField.id = 'suggestion';
    suggestionField.name = 'suggestion';
    suggestionField.rows = 2;
    suggestionField.classList.add('form__input');
    suggestionGroup.append(suggestionLabel, suggestionField);

    const imageGroup = document.createElement('div');
    imageGroup.classList.add('form__group');
    const imageLabel = document.createElement('label');
    imageLabel.setAttribute('for', 'image-upload');
    imageLabel.innerText = 'Imagine:';
    const imageDiv = document.createElement('div');
    imageDiv.classList.add('form__image');
    const imageField = document.createElement('input');
    imageField.type = 'file';
    imageField.classList.add('form__input');
    imageField.id = 'image-upload';
    imageField.name = 'image-upload';
    imageField.accept = 'image/*';
    const imagePreview = document.createElement('img');
    imagePreview.id = 'image-preview';
    imagePreview.src = '';
    imagePreview.alt = 'Image Preview';
    imagePreview.style.display = 'none';
    const imageRow = document.createElement('div');
    imageRow.classList.add('form__row');
    const imageReset = document.createElement('button');
    imageReset.type = 'button';
    imageReset.classList.add('button');
    imageReset.id = 'image-reset';
    imageReset.innerText = 'Resetează imaginea';
    imageReset.style.display = 'none';
    imageRow.append(imageReset);
    imageDiv.append(imageField, imagePreview, imageRow);
    imageGroup.append(imageLabel, imageDiv);

    const buttonsDiv = document.createElement('div');
    buttonsDiv.classList.add('form__buttons');
    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.innerText = 'Confirmă';
    buttonsDiv.append(submitButton);

    form.append(
        titleGroup,
        designGroup,
        purposeGroup,
        suggestionGroup,
        imageGroup,
        buttonsDiv
    );

    return form;
};

export const categoryFormValidator = {
    title: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Titlul trebuie să fie între 0 și TODO de caractere',
    },
    design: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Aspectul trebuie să fie între 0 și TODO de caractere',
    },
    purpose: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Scopul trebuie să fie între 0 și TODO de caractere',
    },
    suggestion: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Sugestiile trebuie să fie între 0 și TODO de caractere',
    },
};

export const categoryFormSubmit = (closeModal, cb, refresh) => {
    return async function (e) {
        e.preventDefault();

        const form = e.target;
        disableFormSubmit(form);

        const validation = validateForm(form, {
            title: {
                predicate: (title) => title.length > 0,
                errorMessage: 'Titlul nu poate fi gol',
            },
            content: {
                predicate: (title) => title.length > 0,
                errorMessage: 'Conținutul nu poate fi gol',
            },
            number: {
                predicate: (number) => Number.isInteger(parseInt(number, 10)),
                errorMessage: 'Numărul nu este valid',
            },
        });

        if (!validation.valid) {
            showFormError(form, validation.message);
            return;
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        try {
            await cb(data);
        } catch (e) {
            showInfoModal(renderError(e));
            enableFormSubmit(form);
            return;
        }

        closeModal();
        refresh();
    };
};

export const populateCategoryForm = (form, category) => {
    setValue(form, 'title', category.title);
    setValue(form, 'suggestion', category.suggestion);
    setValue(form, 'design', category.design);
    setValue(form, 'purpose', category.purpose);
};

export const renderSignForm = () => {
    const form = document.createElement('form');
    form.classList.add('form');

    form.innerHTML = signFormInnerHtml;

    return form;
};

// TODO
export const signFormValidator = {
    title: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Titlul trebuie să fie între 0 și TODO de caractere',
    },
    design: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Aspectul trebuie să fie între 0 și TODO de caractere',
    },
    purpose: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Scopul trebuie să fie între 0 și TODO de caractere',
    },
    suggestion: {
        predicate: (title) => title.length > 0,
        errorMessage: 'Sugestiile trebuie să fie între 0 și TODO de caractere',
    },
};
