import { renderError } from '/js/errors.js';
import { showInfoModal } from '/js/modals.js';

window.addEventListener('load', () => {
    // if there's a search param of type `errorCode`, show an infoModal
    const errorCode = new URLSearchParams(document.location.search).get(
        'errorCode'
    );

    if (errorCode) {
        showInfoModal(renderError(errorCode));
    }
});
