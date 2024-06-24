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

export const getBase64Buffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64Image = e.target.result;
            resolve(base64Image);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};

// export const setImagePreview = (preview, button, data) => {

//     if (data) {
//         preview.src = data;
//         preview.style.display = 'block';
//         if (!data.startsWith('http')) {
//             button.style.display = 'block';
//         } else {
//             button.style.display = 'none';
//         }
//     } else {
//         preview.src = '';
//         preview.style.display = 'none';
//         button.style.display = 'none';
//     }
// };

export const renderCategoryForm = () => {
    const form = document.createElement('form');
    form.classList.add('form');
    form.innerHTML = signCategoryFormInnerHtml;

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

    // setImagePreview(category.image);
};

export const renderSignForm = () => {
    const form = document.createElement('form');
    form.classList.add('form');

    form.innerHTML = signFormInnerHtml;

    return form;
};

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
