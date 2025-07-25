import { userData } from '/js/auth.js';
import { addFormSubmit } from '../forms.js';
import { changePassword } from '../requests.js';
import { getToken, verifyToken } from '../utils.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { fixPasswordInputs } from '/js/showPassword.js';

const submitData = async (data) => {
    await fixPasswordInputs(document.getElementById('form'));
    const token = getToken();
    await changePassword(token, data.password);
    await userData(); // force-update user data
    showInfoModal(
        renderMessage(
            'Schimbarea a avut loc cu succes. Veți fi redirectat la pagina principală.'
        ),
        () => {
            window.location.href = '/';
        }
    );
};

window.addEventListener('load', () => {
    verifyToken();
    addFormSubmit('form', submitData, {
        password: {
            predicate: (password) =>
                password.length >= 8 && password.length <= 64,
            errorMessage:
                'Parola trebuie să aibă minim 8 și maxim 64 caractere',
        },
    });
});
