import { setProperty, setValue } from '/js/form/utils.js';
import { renderError } from '/js/errors.js';
import {
    showInfoModal,
    showConfirmModal,
    showGeneralModal,
} from '/js/modals.js';
import { renderMessage, showLoading } from '/js/render.js';
import { isAdmin } from '/js/auth.js';
import { showFormError, clearFormError } from '/js/form/errors.js';
import { validateForm } from '/js/form/validate.js';
import { disableFormSubmit, enableFormSubmit } from '/js/form/utils.js';
import { postChapter, postChapterForm } from './requests.js';
import { readFileIntoString } from '/js/utils.js';

export const renderChapterForm = () => {
    if (!isAdmin()) {
        return;
    }
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
    // <label for="import" class="button"></label>
    //                     <input type="file" accept="text/csv, application/json" id="import" class="button" style="display: none">
    const impLabel = document.createElement('label');
    impLabel.className = 'button';
    impLabel.textContent = 'Importă';
    impLabel.htmlFor = 'import';
    const impInput = document.createElement('input');
    impInput.type = 'file';
    impInput.accept = 'text/csv, application/json';
    impInput.id = 'import';
    impInput.style.display = 'none';
    buttons.append(impLabel, impInput, confirm);
    impInput.addEventListener('change', async (event) => {
        try {
            const file = event.target.files[0];
            if (file.type.includes('text/csv')) {
                const formData = new FormData();
                formData.append('csv', file, 'file.csv');
                showInfoModal(
                    renderMessage('Capitolele noi au fost adăugat cu succes.'),
                    () => {
                        window.location.reload();
                    }
                );
            } else {
                let result;
                try {
                    result = JSON.parse(await readFileIntoString(file));
                } catch (err) {
                    showInfoModal(
                        renderMessage(
                            `Eroare la citirea fișierului JSON. Fișierul este invalid`
                        ),
                        () => {
                            window.location.reload();
                        }
                    );
                }
                await postChapter(result);
                showInfoModal(
                    renderMessage('Capitolele noi au fost adăugat cu succes.'),
                    () => {
                        window.location.reload();
                    }
                );
            }
        } catch (err) {
            showInfoModal(
                renderMessage('Eroare la import, fișier invalid'),
                () => {
                    window.location.reload();
                }
            );
        }
    });

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
            enableFormSubmit(form);
            return;
        } else {
            clearFormError(form);
        }

        const formData = new FormData(form);
        const data = Object.fromEntries(formData);

        data.number = parseInt(data.number, 10);
        data.isaddendum = formData.get('isaddendum') === 'on' ? true : false;

        try {
            await onConfirm(data);
            enableFormSubmit(form);
        } catch (e) {
            showInfoModal(renderError(e));
            enableFormSubmit(form);
            return;
        }

        closeModal();
        refresh();
    };
};
