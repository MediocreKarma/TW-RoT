/**
 * Validates a form based on the provided validators.
 *
 * @param {HTMLFormElement} form - The form DOM node to validate.
 * @param {Object} validators - An object containing validation rules for form fields.
 * @param {Object.<string, {predicate: function(any): boolean, errorMessage: string}>} validators.<fieldName> - An object where each key is a field name, and the value is an object containing:
 *   - `predicate`: A function that takes a field value and returns a boolean indicating if the field is valid.
 *   - `errorMessage`: A string containing the error message to display if the field is invalid.
 * @returns {Object} The validation result.
 * @returns {boolean} return.valid - Indicates whether the form is valid.
 * @returns {string} [return.message] - An optional message providing details about the validation result.
 *
 */
export const validateForm = (form, validators) => {
    let allRequiredFilled = true;

    form.querySelectorAll('[required]').forEach((input) => {
        if (!allRequiredFilled) {
            return;
        }
        if (!input.value) {
            allRequiredFilled = false;
            return;
        }
    });

    if (!allRequiredFilled) {
        return {
            valid: false,
            message: 'Nu sunt completate toate câmpurile obligatorii',
        };
    }

    let predicateResults;

    form.querySelectorAll('input').forEach((input) => {
        const inputName = input?.getAttribute('name');
        if (!inputName) {
            return;
        }
        if (inputName.endsWith('-confirm')) {
            return;
        }
        if (predicateResults) {
            return;
        }
        if (!validators[inputName]) {
            return;
        }
        const validator = validators[inputName];
        const isValid = validator.predicate(input.value);
        if (!isValid) {
            predicateResults = {
                valid: false,
                message: validator.errorMessage
                    ? validator.errorMessage
                    : `Câmpul "${inputName}" nu este valid`,
            };
        }

        if (validator.confirm && validator.confirm.field) {
            const confirmInput = form.querySelector(
                `input[name=${validator.confirm.field}]`
            );
            if (!confirmInput) {
                return;
            }
            if (confirmInput.value !== input.value) {
                predicateResults = {
                    valid: false,
                    message: validator.confirm.errorMessage
                        ? validator.confirm.errorMessage
                        : `Câmpurile "${inputName}" și "${validator.confirm.field}" trebuie să fie egale`,
                };
            }
        }
    });

    if (predicateResults) {
        return predicateResults;
    }

    return {
        valid: true,
    };
};
