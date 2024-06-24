import API from '/js/api.js';
import { post } from '/js/authRequests.js';
import { renderMessage } from '/js/render.js';
import { validateForm } from '/js/form/validate.js';
import { showFormError, clearFormError } from '/js/form/errors.js';
import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';
import { enableFormSubmit, disableFormSubmit } from '/js/form/utils.js';
import { fixPasswordInputs } from '/js/showPassword.js';

const fetchSignup = async (data) => {
    const response = await post(`${API.AUTH}/auth/register`, data);
    return response;
};

const onFormSubmit = async (event) => {
    event.preventDefault();
    const form = event.target;

    fixPasswordInputs(form);

    const validation = validateForm(form, {
        username: {
            predicate: (username) =>
                username.length >= 6 &&
                username.length <= 64 &&
                /^[a-zA-Z0-9_\.]+$/.test(username),
            errorMessage:
                'Numele de utilizator trebuie să aibă între 6 și 64 de caractere, și poate conține doar: caractere alfanumerice, . și _',
        },
        email: {
            predicate: (email) => email.length >= 3 && email.length <= 256, // && email.contains('@'),
            errorMessage:
                'Email-ul trebuie să fie valid și să aibă între 3 și 256 de caractere',
        },
        password: {
            predicate: (password) =>
                password.length >= 8 && password.length <= 64,
            errorMessage: 'Parola trebuie să aibă minim 8 caractere',
            confirm: {
                field: 'password-confirm',
                errorMessage: 'Parolele nu sunt la fel',
            },
        },
    });

    if (!validation.valid) {
        showFormError(form, validation.message);
        return;
    }

    clearFormError(form);
    disableFormSubmit(form);

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    try {
        await fetchSignup({
            username: dataObject.username,
            password: dataObject.password,
            email: dataObject.email,
        });

        showInfoModal(
            renderMessage(
                'Contul a fost creat cu succes. Veți primi în scurt timp un email de confirmare a contului.'
            ),
            () => {
                window.location.href = '/login';
            }
        );
    } catch (e) {
        enableFormSubmit(form);
        showInfoModal(renderError(e));
    }
};

window.addEventListener('load', () => {
    const form = document.getElementById('form');
    form.addEventListener('submit', onFormSubmit);
});
