import { validateForm } from '/js/form/validate.js';
import { showFormError, removeFormError } from '/js/form/errors.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';
import { enableFormSubmit, disableFormSubmit } from '/js/form/utils.js';

export const addFormSubmit = async (formId, submitCallback, validators) => {
    const form = document.getElementById(formId);
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const form = event.target;

        const validation = validateForm(form, validators);

        if (!validation.valid) {
            showFormError(form, validation.message);
            return;
        }

        removeFormError(form);
        disableFormSubmit(form);

        const data = new FormData(event.target);
        const dataObject = Object.fromEntries(data.entries());

        try {
            await submitCallback(dataObject);
            enableFormSubmit(form);
        } catch (e) {
            enableFormSubmit(form);
            showInfoModal(renderError(e));
        }
    });
};
