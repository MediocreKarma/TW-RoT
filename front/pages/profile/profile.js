import { userData } from '/js/auth.js';
import { requestChange } from './requests.js';
import { renderMessage } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';

window.addEventListener('load', () => {
    let username = document.getElementById('username');
    username.innerText = userData().username;

    const buttons = document.querySelectorAll('button[__type]');

    buttons.forEach((button) => {
        button.addEventListener('click', async () => {
            try {
                // wait for confirmation
                const type = button.getAttribute('__type');

                const changeTypeString = (() => {
                    switch (type) {
                        case 'email':
                            return 'email-ul';
                        case 'username':
                            return 'numele de utilizator';
                        case 'password':
                            return 'parola';
                        default:
                            return null;
                    }
                })();
                if (!changeTypeString) {
                    return;
                }

                const confirmed = await showConfirmModal(
                    renderMessage(
                        `Sigur doriți să vă schimbați ${changeTypeString}?`
                    )
                );
                if (!confirmed) {
                    return;
                }

                button.disabled = true;
                await requestChange(button.getAttribute('__type'));

                showInfoModal(
                    renderMessage(
                        'Veți primi în scurt timp un email de confirmare a schimbării dorite, pe adresa de email asociată contului.'
                    )
                );
                button.disabled = false;
            } catch (e) {
                showInfoModal(renderError(e));
            }
        });
    });
});
