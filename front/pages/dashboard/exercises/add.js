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
import { getExerciseCategories, submitExercise } from './requests.js';

const onFormSubmit = async (event) => {
    event.preventDefault();

    const form = event.target;
    setSubmitButtonDisabled(form, true);
    const data = await collectFormData(form);
    const validation = validateFormData(data);

    console.log(validation);
    if (!validation.valid) {
        showFormError(form, validation.message);
        return;
    } else {
        clearFormError(form);
    }

    const formData = convertObjectToFormData(data);
    console.log(formData);

    try {
        const questionData = await submitExercise(formData);
        setSubmitButtonDisabled(form, false);
        showInfoModal(
            renderMessage(
                `Întrebarea a fost înregistrată cu succes. Veți fi redirectat la pagina de dashboard.`
            ),
            () => {
                window.location.href = `/dashboard/exercises?query=${questionData?.id}`;
            }
        );
    } catch (e) {
        showInfoModal(renderError(e));
    }
};

document.addEventListener('DOMContentLoaded', async () => {
    addListenerToImageInput();
    addListenerToImageResetInput();

    const categories = await getExerciseCategories();
    showCategories(categories.categories);

    const form = document.getElementById('exercise-form');
    console.log(await collectFormData(form));

    document
        .getElementById('exercise-form')
        .addEventListener('submit', onFormSubmit);
});
