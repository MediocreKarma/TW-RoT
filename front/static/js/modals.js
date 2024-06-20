const createOrUpdateModal = (innerNode, id = '__modal', confirm = false) => {
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
        closeButton.innerText = 'X';
        closeButton.classList.add('modal__close');
        modal.appendChild(closeButton);

        let modalContent = document.createElement('div');
        modalContent.classList.add('modal__content');
        modal.appendChild(modalContent);

        modalOverlay.appendChild(modal);
        document.body.prepend(modalOverlay);
    }
    modalOverlay.querySelector('.modal__content').appendChild(innerNode);
    return modalOverlay;
};

export const showInfoModal = (modalContent, onClose = undefined) => {
    const id = Math.random().toString(36).slice(2, 9);
    const modalId = `error-modal-${id}`;
    let modal = createOrUpdateModal(modalContent, modalId);
    const closeBtn = document.getElementById(`${modalId}-close`);

    closeBtn.onclick = function (e) {
        if (onClose) {
            onClose(e);
        }
        modal.parentNode?.removeChild(modal);
    };
};

export const showConfirmModal = (
    modalContent,
    onClose = undefined,
    waitToConfirm = true // not sure if I'll need this but... I'm keeping it around for whenever I *might* add an onConfirm callback
) => {
    return new Promise((resolve) => {
        const id = 'confirm-modal';
        const modal = createOrUpdateModal(modalContent, id);
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
