export const showFormError = (form, message) => {
    if (form.querySelector('.form__error')) {
        let errorDiv = form.querySelector('.form__error');
        errorDiv.innerText = message;
        return;
    }
    let errorDiv = document.createElement('p');
    errorDiv.classList.add('form__error');
    errorDiv.innerText = message;
    form.prepend(errorDiv);
};

export const clearFormError = (form) => {
    const error = form.querySelector('.form__error');
    if (error) {
        form.removeChild(error);
    }
};
