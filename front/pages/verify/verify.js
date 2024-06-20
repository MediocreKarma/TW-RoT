import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';
import { renderMessage } from '/js/render.js';

import API from '/js/api.js';
import { post } from '/js/requests.js';

const apiVerifyToken = async (token) => {
    const response = await post(`${API.AUTH}/auth/verify`, { token });
    return await response.json();
};

const verifyToken = async () => {
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

    // if token, check with fetch
    try {
        await apiVerifyToken(token);
        showInfoModal(
            renderMessage(
                'Verificarea s-a efectuat cu succes. Veți fi redirectat la pagina principală.'
            ),
            () => {
                window.location.href = '/';
            }
        );
    } catch (e) {
        showInfoModal(renderError(e), () => {
            window.location.href = '/';
        });
    }
};

document.addEventListener('DOMContentLoaded', verifyToken);
