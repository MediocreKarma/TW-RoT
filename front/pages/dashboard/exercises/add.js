import {
    addListenerToImageInput,
    addListenerToImageResetInput,
    showCategories,
    collectFormData,
} from './form.js';

document.addEventListener('DOMContentLoaded', async () => {
    addListenerToImageInput();
    addListenerToImageResetInput();
    showCategories();
    const form = document.getElementById('exercise-form');
    console.log(await collectFormData(form));

    document
        .getElementById('exercise-form')
        .addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log(await collectFormData(form));
        });
});
