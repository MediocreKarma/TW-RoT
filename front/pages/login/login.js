import { setUserData } from '/js/auth.js';
import API from '/js/api.js';
import { post } from '/js/requests.js';
import { validateForm } from '/js/form/validate.js';
import { showFormError, removeFormError } from '/js/form/errors.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';
import { enableFormSubmit, disableFormSubmit } from '/js/form/utils.js';

const fetchLogin = async (data) => {
    const response = await post(`${API.AUTH}/auth/login`, data);
    return await response.json();
};

const onFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    const validation = validateForm(form, {
        identifier: {
            predicate: (identifier) => identifier.length >= 3,
        },
        password: {
            predicate: (password) =>
                password.length >= 8 && password.length <= 64,
            errorMessage:
                'Parola trebuie să aibă minim 8 și maxim 64 caractere',
        },
    });

    if (!validation.valid) {
        showFormError(form, validation.message);
        return;
    }

    removeFormError(form);
    disableFormSubmit(form);

    const data = new FormData(form);
    const dataObject = Object.fromEntries(data.entries());

    try {
        const response = await fetchLogin(dataObject);
        setUserData(response.user);
        window.location.href = '/';
    } catch (e) {
        enableFormSubmit(form);
        showInfoModal(renderError(e));
    }
};

window.addEventListener('load', () => {
    const form = document.querySelector('form');
    form.onsubmit = onFormSubmit;
});
