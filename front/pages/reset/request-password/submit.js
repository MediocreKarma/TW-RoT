import { addFormSubmit } from '../forms.js';
import { requestChangePassword } from '../requests.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { fixPasswordInputs } from '/js/showPassword.js';

const submitData = async (data) => {
    await fixPasswordInputs(document.getElementById('form'));
    await requestChangePassword(data.email);
    showInfoModal(
        renderMessage(
            'Veți primi în scurt timp un email de confirmare a identității, cu un link prin care vă veți putea schimba parola. Veți fi redirectat la pagina principală.'
        ),
        () => {
            window.location.href = '/';
        }
    );
};

window.addEventListener('load', () => {
    addFormSubmit('form', submitData, {
        password: {
            predicate: (password) =>
                password.length >= 8 && password.length <= 64,
            errorMessage:
                'Parola trebuie să aibă minim 8 și maxim 64 caractere',
        },
    });
});
