import {
    addListenerToImageInput,
    addListenerToImageResetInput,
    showCategories,
    collectFormData,
    validateFormData,
    convertObjectToFormData,
    setSubmitButtonDisabled,
    setImagePreview,
} from './form.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showFormError, clearFormError } from '/js/form/errors.js';
import { setProperty, setValue } from '/js/form/utils.js';
import {
    getExerciseCategories,
    getExercise,
    postExercise,
    deleteExercise,
} from '../requests.js';

let imgSrc = null;

const onFormSubmit = async (originalData, event) => {
    event.preventDefault();

    const form = event.target;
    setSubmitButtonDisabled(form, true);
    const data = await collectFormData(form);
    const validation = validateFormData(data);

    if (!validation.valid) {
        showFormError(form, validation.message);
        setSubmitButtonDisabled(form, false);
        return;
    } else {
        clearFormError(form);
    }

    const mergedData = {
        ...originalData,
        ...data,
    };

    const formData = convertObjectToFormData(mergedData);

    try {
        const postQuestionData = await postExercise(formData);
        await deleteExercise(originalData.id);
        setSubmitButtonDisabled(form, false);
        showInfoModal(
            renderMessage(
                `Întrebarea a fost modificată cu succes. Veți fi redirectat la pagina de dashboard.`
            ),
            () => {
                window.location.href = `/dashboard/exercises${
                    postQuestionData?.text
                        ? '?query=' + postQuestionData?.text.slice(0, 100)
                        : ''
                }`;
            }
        );
    } catch (e) {
        showInfoModal(renderError(e));
    }
};

const getQuestionId = () => {
    const url = new URL(window.location.href);

    const pathParts = url.pathname.split('/');
    const id = pathParts[3];

    return parseInt(id, 10);
};

const populateForm = (form, questionData) => {
    setValue(form, 'description', questionData.text);

    for (let i = 0; i < Math.min(questionData.answers.length, 3); ++i) {
        setValue(form, `answer${i + 1}`, questionData.answers[i].description);
        if (questionData.answers[i].correct) {
            setProperty(form, `correct${i + 1}`, 'checked', true);
        }
    }
    setValue(form, 'category-id', questionData.categoryId);
    setImagePreview(questionData.image);
    imgSrc = questionData.image ? questionData.imageId : null;
};

export const addListenerToImageDeleteInput = (refSrc) => {
    const imageUpload = document.getElementById('image-upload');
    const deleteBtn = document.getElementById('image-delete');
    const resetBtn = document.getElementById('image-reset');

    deleteBtn.addEventListener('click', () => {
        imageUpload.value = '';
        setImagePreview('');
        refSrc = null;
        deleteBtn.style.display = 'none';
        resetBtn.style.display = 'block';
    });
};

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const id = getQuestionId();
        const questionData = await getExercise(id);

        const categories = await getExerciseCategories();
        showCategories(categories.categories);

        const form = document.getElementById('exercise-form');

        populateForm(form, questionData);
        document.querySelector('#question-id').innerText = id;

        addListenerToImageInput();
        addListenerToImageResetInput(questionData.image, imgSrc);
        addListenerToImageDeleteInput(imgSrc);

        document
            .getElementById('exercise-form')
            .addEventListener(
                'submit',
                async (e) => await onFormSubmit(questionData, e)
            );
    } catch (e) {
        showInfoModal(renderError(e));
    }
});
