import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';

export const verifyToken = () => {
    const token = new URLSearchParams(document.location.search).get('token');
    if (!token) {
        showInfoModal(
            renderMessage(
                'Eroare: Nu a fost găsit un token. Veți fi redirectat la pagina principală.'
            ),
            () => {
                window.location.href = '/';
            }
        );
        return;
    }
};

export const getToken = () => {
    return new URLSearchParams(document.location.search).get('token');
};
