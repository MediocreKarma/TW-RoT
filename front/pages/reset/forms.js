import { validateForm } from '/js/form/validate.js';
import { showFormError, clearFormError } from '/js/form/errors.js';
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

        clearFormError(form);
        disableFormSubmit(form);

        const data = new FormData(event.target);
        const dataObject = Object.fromEntries(data.entries());

        try {
            await submitCallback(dataObject);
        } catch (e) {
            showInfoModal(renderError(e));
        } finally {
            enableFormSubmit(form);
        }
    });
};
