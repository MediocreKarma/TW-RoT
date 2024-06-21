import { addFormSubmit } from '../forms.js';
import { changeUsername } from '../requests.js';
import { getToken, verifyToken } from '../utils.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { userData } from '/js/auth.js';

const submitData = async (data) => {
    const token = getToken();
    await changeUsername(token, data.username);
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
        username: {
            predicate: (username) =>
                username.length >= 6 &&
                username.length <= 64 &&
                /^[a-zA-Z0-9_\.]+$/.test(username),
            errorMessage:
                'Numele de utilizator trebuie să aibă între 6 și 64 de caractere, și poate conține doar: caractere alfanumerice, . și _',
        },
    });
});
