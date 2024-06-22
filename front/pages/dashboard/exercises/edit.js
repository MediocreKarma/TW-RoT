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
});
