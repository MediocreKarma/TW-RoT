/**
 * Base function for modals. Creates a modal with specified id.
 *
 * @param {*} innerNode the DOM node with the inner contents of the modal
 * @param {*} id the ID of the modal
 * @returns the DOM node representing the modal
 */
const createOrUpdateModal = (innerNode, id = '__modal') => {
    let modalOverlay = document.getElementById(id);
    if (!modalOverlay) {
        modalOverlay = document.createElement('div');
        modalOverlay.classList.add('modal__overlay');
        modalOverlay.id = id;

        let modal = document.createElement('div');
        modal.classList.add('modal');

        // add close btn
        let closeButton = document.createElement('button');
        closeButton.id = id + '-close';
        closeButton.innerText = '✖';
        closeButton.classList.add('modal__close');
        modal.appendChild(closeButton);

        let modalContent = document.createElement('div');
        modalContent.classList.add('modal__content');
        modal.appendChild(modalContent);

        modalOverlay.appendChild(modal);
    }
    modalOverlay.querySelector('.modal__content').appendChild(innerNode);
    return modalOverlay;
};

/**
 * Shows a modal on screen with a random id. Returns a function
 * which removes the modal from the screen.
 *
 * @param {*} modalContent the DOM node with the inner contents of the modal
 * @param {*} onClose function to be executed upon close
 * @returns a function which removes the modal from the screen,
 * without executing onClose
 */
export const showInfoModal = (modalContent, onClose = undefined) => {
    const id = Math.random().toString(36).slice(2, 9);
    const modalId = `error-modal-${id}`;
    let modal = createOrUpdateModal(modalContent, modalId);
    document.body.append(modal);
    const closeBtn = document.getElementById(`${modalId}-close`);

    const onCloseModal = () => {
        modal.parentNode?.removeChild(modal);
    };

    closeBtn.onclick = (e) => {
        if (onClose) {
            onClose(e);
        }
        onCloseModal();
    };

    return onCloseModal;
};

/**
 * Shows a confirm modal on screen. Returns whether the user confirmed or not.
 *
 * @param {*} modalContent the DOM node with the inner contents of the modal
 * @returns true / false, whether the user confirmed
 */
export const showConfirmModal = (modalContent) => {
    return new Promise((resolve) => {
        const id = 'confirm-modal';
        const modal = createOrUpdateModal(modalContent, id);
        document.body.append(modal);

        const closeBtn = document.getElementById(`${id}-close`);

        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('modal__buttons');

        const cancelButton = document.createElement('button');
        cancelButton.type = 'button';
        cancelButton.innerText = 'Anulare';
        cancelButton.classList.add('modal__button--cancel');
        buttonContainer.appendChild(cancelButton);

        const confirmButton = document.createElement('button');
        confirmButton.type = 'button';
        confirmButton.innerText = 'Confirmare';
        confirmButton.classList.add('modal__button--confirm');
        buttonContainer.appendChild(confirmButton);

        modal.querySelector('.modal').appendChild(buttonContainer);

        closeBtn.onclick = function () {
            modal.parentNode?.removeChild(modal);
            resolve(false);
        };

        confirmButton.onclick = function () {
            modal.parentNode?.removeChild(modal);
            resolve(true);
        };

        cancelButton.onclick = function () {
            modal.parentNode?.removeChild(modal);
            resolve(false);
        };
    });
};
