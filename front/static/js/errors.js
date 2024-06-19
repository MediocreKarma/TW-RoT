const errors = {
    0: 'Eroare internă',
    2: 'Rută inexistentă',
    // USERNAME_NOT_IN_BODY: 3,
    4: 'Numele de utilizator este prea scurt',
    5: 'Numele de utilizator este prea lung',
    6: 'Numele de utilizator deja există',
    // EMAIL_NOT_IN_BODY: 7,
    // BAD_EMAIL: 8,
    // PASSWORD_NOT_IN_BODY: 9,
    // PASSWORD_TOO_SHORT: 10,
    // PASSWORD_TOO_LONG: 11,
    // USERNAME_INVALID_CHARS: 12,
    // VERIFICATION_TOKEN_NOT_IN_BODY: 13,
    // INVALID_VERIFICATION_TOKEN: 14,
    // EXPIRED_VERIFICATION_TOKEN: 15,
    // CHANGE_TYPE_NOT_IN_BODY: 16,
    // CHANGE_TYPE_INCORRECT: 17,
    // CHANGE_REQUEST_TOKEN_NOT_IN_BODY: 18,
    // INVALID_CHANGE_REQUEST_TOKEN: 19,
    // EXPIRED_CHANGE_REQUEST_TOKEN: 20,
    // COOKIE_HEADER_NOT_FOUND: 21,
    // AUTH_COOKIE_NOT_FOUND: 22,
    // AUTH_COOKIE_INVALID: 23,
    26: 'Capitolul cerut din Codul Rutier nu există',
    27: 'Capitolul cerut din Codul Rutier este invalid',
    28: 'Întrebare invalidă',
    29: 'Întrebare inexistentă',
    30: 'Categoria de indicatoare rutiere cerută este invalidă',
    31: 'Categoria de indicatoare rutiere cerută nu există',
};

export const getErrorMessageFromCode = (errorCode) => {
    console.log(errorCode);
    if (errorCode in errors) {
        return errors[errorCode];
    }
    return 'Eroare necunoscută';
};

export const getErrorCode = (errorData) => {
    return errorData?.body?.errorCode;
};

export const getErrorMessage = (errorData) => {
    console.log(errorData);
    return getErrorMessageFromCode(errorData?.body?.errorCode);
};

export const renderError = (errorData) => {
    // let errorContainer = document.createElement('div');
    // errorContainer.className = 'error';

    let errorInfoContainer = document.createElement('div');
    errorInfoContainer.className = 'error__info';

    // let title = document.createElement('h1');
    // title.textContent = 'Ne pare rău!';
    // errorInfoContainer.appendChild(title);

    let mainMessage = document.createElement('p');
    mainMessage.textContent = 'A intervenit o eroare:';
    errorInfoContainer.appendChild(mainMessage);

    let errorDetails = document.createElement('p');
    errorDetails.className = 'error__details';
    let errorMessage = getErrorMessage(errorData);
    errorDetails.innerText = errorMessage;
    errorInfoContainer.appendChild(errorDetails);

    return errorInfoContainer;

    // let button = document.createElement('a');
    // button.className = 'button';
    // button.textContent = 'Acasă';
    // button.href = '/';
    // errorInfoContainer.appendChild(button);

    // errorContainer.appendChild(errorInfoContainer);

    // if (!container) {
    //     container = document.querySelector('.main-container');
    // }

    // container.innerHTML = '';
    // container.appendChild(errorInfoContainer);
};
