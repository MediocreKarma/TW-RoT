import { addFormSubmit } from '../forms.js';
import { changeEmail } from '../requests.js';
import { getToken, verifyToken } from '../utils.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';
import { userData } from '/js/auth.js';

const submitData = async (data) => {
    const token = getToken();
    await changeEmail(token, data.email);
    await userData(); // force-update user data
    showInfoModal(
        renderMessage(
            'Veți primi în scurt timp un email de confirmare a adresei furnizate. Veți fi redirectat la pagina principală.'
        ),
        () => {
            window.location.href = '/';
        }
    );
};

window.addEventListener('load', () => {
    verifyToken();
    addFormSubmit('form', submitData, {
        email: {
            predicate: (email) => email.length >= 3 && email.length <= 256, // && email.contains('@'),
            errorMessage:
                'Email-ul trebuie să fie valid și să aibă între 3 și 256 de caractere',
        },
    });
});
