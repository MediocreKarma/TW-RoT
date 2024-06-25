window.addEventListener('load', () => {
    document.querySelectorAll('input[type="password"]').forEach((input) => {
        const viewPassImg = document.createElement('img');
        viewPassImg.src = '/img/eye.png';
        viewPassImg.classList.add('form__password-toggle-icon');
        viewPassImg.addEventListener('click', () => {
            if (input.getAttribute('type') === 'text') {
                input.setAttribute('type', 'password');
                viewPassImg.src = '/img/eye.png';
                viewPassImg.classList.remove('form__password-toggle-icon--on');
            } else {
                input.setAttribute('type', 'text');
                viewPassImg.src = '/img/eyeSlashed.png';
                viewPassImg.classList.add('form__password-toggle-icon--on');
            }
        });
        input.parentNode.insertBefore(viewPassImg, input.nextSibling);
    });
});

export const fixPasswordInputs = (form) => {
    for (const img of form.getElementsByClassName(
        'form__password-toggle-icon'
    )) {
        const input = img.previousElementSibling;
        input.setAttribute('type', 'password');
    }
};
