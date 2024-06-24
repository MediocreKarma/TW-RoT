import { setProperty, setValue } from '/js/form/utils.js';
import { renderError } from '/js/errors.js';
import {
    showInfoModal,
    showConfirmModal,
    showGeneralModal,
} from '/js/modals.js';
import { renderMessage, showLoading } from '/js/render.js';
import { isAdmin } from '/js/auth.js';
import { showFormError } from '/js/form/errors.js';
import { validateForm } from '/js/form/validate.js';
import { disableFormSubmit, enableFormSubmit } from '/js/form/utils.js';

export const renderChapterForm = () => {
    const form = document.createElement('form');
    form.classList.add('form');
    const titleGroup = document.createElement('div');
    titleGroup.classList.add('form__group');
    const titleLabel = document.createElement('label');
    titleLabel.innerText = 'Titlu';
    const titleField = document.createElement('input');
    titleField.type = 'text';
    titleField.name = 'title';
    titleField.classList.add('form__input');
    titleGroup.append(titleLabel);
    titleGroup.append(titleField);
    form.append(titleGroup);
    const contentGroup = document.createElement('div');
    contentGroup.classList.add('form__group');
    const contentLabel = document.createElement('label');
    contentLabel.innerText = 'Conținut';
    const contentField = document.createElement('textarea');
    contentField.rows = 10;
    contentField.name = 'content';
    contentField.classList.add('form__input');
    contentGroup.append(contentLabel);
    contentGroup.append(contentField);
    form.append(contentGroup);
    const numberGroup = document.createElement('div');
    numberGroup.classList.add('form__group');
    const numberLabel = document.createElement('label');
    numberLabel.innerText = 'Număr';
    const numberField = document.createElement('input');
    numberField.type = 'number';
    numberField.name = 'number';
    numberField.classList.add('form__input');
    numberGroup.append(numberLabel);
    numberGroup.append(numberField);
    form.append(numberGroup);
    const addendumGroup = document.createElement('div');
    addendumGroup.classList.add('form__row--between');
    const addendumLabel = document.createElement('label');
    addendumLabel.innerText = 'Este anexă?';
    const addendumField = document.createElement('input');
    addendumField.type = 'checkbox';
    addendumField.name = 'isaddendum';
    addendumField.classList.add('form__input');
    addendumGroup.append(addendumLabel);
    addendumGroup.append(addendumField);
    form.append(addendumGroup);
    const buttons = document.createElement('div');
    buttons.classList.add('form__buttons');
    const confirm = document.createElement('button');
    confirm.innerText = 'Confirmă';
    confirm.type = 'submit';
    buttons.append(confirm);
    form.append(buttons);
    return form;
};

export const populateChapterForm = (form, chapter) => {
    setValue(form, 'title', chapter.title);
    setValue(form, 'content', chapter.content);
    setValue(form, 'number', `${chapter.number}`);
    setProperty(
        form,
        'isaddendum',
        'checked',
        chapter.isaddendum ? true : undefined
    );
};

export const chapterFormSubmit = (closeModal, onConfirm, refresh) => {
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

        data.number = parseInt(data.number, 10);
        data.isaddendum =
            formData.get('isaddendum') === undefined ? false : true;

        try {
            await onConfirm(data);
        } catch (e) {
            showInfoModal(renderError(e));
            enableFormSubmit(form);
            return;
        }

        closeModal();
        refresh();
    };
};
