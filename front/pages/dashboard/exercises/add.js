import {
    addListenerToImageInput,
    addListenerToImageResetInput,
    showCategories,
    collectFormData,
    validateFormData,
    convertObjectToFormData,
    setSubmitButtonDisabled,
} from './form.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showFormError, clearFormError } from '/js/form/errors.js';
import {
    getExerciseCategories,
    postExercise,
    postExercises,
} from '../requests.js';
import { readFileIntoString } from '/js/utils.js';

export const reactToSubmitResponse = async (
    form,
    formData,
    multiple = false
) => {
    try {
        const questionData = multiple
            ? await postExercises(formData)
            : await postExercise(formData);
        setSubmitButtonDisabled(form, false);
        showInfoModal(
            renderMessage(
                `${
                    multiple
                        ? 'Întrebările au fost înregistrate cu succes'
                        : 'Întrebarea a fost înregistrată cu succes'
                }. Veți fi redirectat la pagina de dashboard.`
            ),
            () => {
                if (!multiple) {
                    window.location.href = `/dashboard/exercises${
                        questionData?.text
                            ? '?query=' + questionData?.text.slice(0, 100)
                            : ''
                    }`;
                } else {
                    window.location.href = '/dashboard/exercises';
                }
            }
        );
    } catch (e) {
        showInfoModal(renderError(e));
    }
};

const onFormSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;
    const data = await collectFormData(form);
    const validation = validateFormData(data);

    if (!validation.valid) {
        showFormError(form, validation.message);
        return;
    } else {
        clearFormError(form);
    }
    setSubmitButtonDisabled(form, true);

    const formData = convertObjectToFormData(data);
    await reactToSubmitResponse(form, formData);
};

document.addEventListener('DOMContentLoaded', async () => {
    addListenerToImageInput();
    addListenerToImageResetInput();

    const categories = await getExerciseCategories();
    showCategories(categories.categories);

    const form = document.getElementById('exercise-form');
    form.addEventListener('submit', onFormSubmit);

    document
        .getElementById('import')
        .addEventListener('change', async (event) => {
            const file = event.target.files[0];
            const formData = new FormData();
            if (file.type.includes('text/csv')) {
                formData.append('csv', file, 'file.txt');
            } else {
                try {
                    const result = await readFileIntoString(file);
                    formData.append('questions', result);
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
            }
            await reactToSubmitResponse(form, formData, true);
        });
});
