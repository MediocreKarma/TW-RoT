const setFormSubmitDisabled = (form, isDisabled) => {
    const submitButton = form.querySelector(
        'button[type="submit"], input[type="submit"]'
    );
    if (submitButton) {
        submitButton.disabled = isDisabled;
    }
};

export const disableFormSubmit = (form) => {
    setFormSubmitDisabled(form, true);
};

export const enableFormSubmit = (form) => {
    setFormSubmitDisabled(form, false);
};

export const setProperty = (form, inputName, property, value) => {
    form.querySelector(`[name=${inputName}]`)[property] = value;
};
export const setValue = (form, inputName, value) =>
    setProperty(form, inputName, 'value', value);
