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

export const showInfoModal = (modalContent, onClose) => {
    let modal = createOrUpdateModal(modalContent, 'error-modal');
    const closeBtn = document.getElementById('error-modal-close');

    closeBtn.onclick = function (e) {
        onClose(e);
        modal.parentNode?.removeChild(modal);
    };
};

// export const showConfirmModal = (
//     modalContent,
//     onClose = undefined,
//     waitToConfirm = true
// ) => {
//     return new Promise((resolve, reject) => {
//         const modal = createOrUpdateModal(innerNode);

//         const closeBtn = document.getElementsByClassName('close')[0];
//         const confirmBtn = document.getElementById('confirmBtn');
//         const cancelBtn = document.getElementById('cancelBtn');

//         modal.style.display = 'block';

//         closeBtn.onclick = function () {
//             modal.style.display = 'none';
//             resolve(false);
//         };

//         confirmBtn.onclick = function () {
//             modal.style.display = 'none';
//             resolve(true);
//         };

//         // When the user clicks on "Cancel" button, close the modal and resolve false
//         cancelBtn.onclick = function () {
//             modal.style.display = 'none';
//             resolve(false);
//         };

//         // When the user clicks anywhere outside of the modal, close it
//         window.onclick = function (event) {
//             if (event.target == modal) {
//                 modal.style.display = 'none';
//                 resolve(false);
//             }
//         };
//     });
// };

// TODO

// export const showFormModal = () => {};
