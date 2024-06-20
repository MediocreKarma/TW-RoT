import { ErrorCodes } from '/js/constants.js';

export const errorMessages = {
    SERVER_ERROR: 'Eroare internă',
    INVALID_METHOD: 'Metodă invalidă',
    ROUTE_NOT_FOUND: 'Ruta nu a fost găsită',
    USERNAME_NOT_IN_BODY: 'Numele de utilizator nu este în corp',
    USERNAME_TOO_SHORT: 'Numele de utilizator este prea scurt',
    USERNAME_TOO_LONG: 'Numele de utilizator este prea lung',
    USERNAME_ALREADY_EXISTS: 'Numele de utilizator există deja',
    EMAIL_NOT_IN_BODY: 'Emailul nu este în corp',
    BAD_EMAIL: 'Email invalid',
    PASSWORD_NOT_IN_BODY: 'Parola nu este în corp',
    PASSWORD_TOO_SHORT: 'Parola este prea scurtă',
    PASSWORD_TOO_LONG: 'Parola este prea lungă',
    USERNAME_INVALID_CHARS: 'Numele de utilizator conține caractere invalide',
    VERIFICATION_TOKEN_NOT_IN_BODY: 'Token-ul de verificare nu este în corp',
    INVALID_VERIFICATION_TOKEN: 'Token-ul de verificare este invalid',
    EXPIRED_VERIFICATION_TOKEN: 'Token-ul de verificare a expirat',
    CHANGE_TYPE_NOT_IN_BODY: 'Tipul de schimbare nu este în corp',
    CHANGE_TYPE_INCORRECT: 'Tipul de schimbare este incorect',
    CHANGE_REQUEST_TOKEN_NOT_IN_BODY:
        'Token-ul cererii de schimbare nu este în corp',
    INVALID_CHANGE_REQUEST_TOKEN: 'Token-ul cererii de schimbare este invalid',
    EXPIRED_CHANGE_REQUEST_TOKEN: 'Token-ul cererii de schimbare a expirat',
    COOKIE_HEADER_NOT_FOUND: 'Header-ul cookie nu a fost găsit',
    AUTH_COOKIE_NOT_FOUND: 'Cookie-ul de autentificare nu a fost găsit',
    AUTH_COOKIE_INVALID: 'Cookie-ul de autentificare este invalid',
    INVALID_IMAGE_ID: 'ID-ul imaginii este invalid',
    TRAFFIC_SIGNS_IMAGE_NOT_FOUND:
        'Imaginea semnelor de circulație nu a fost găsită',
    CHAPTER_NOT_FOUND: 'Capitolul nu a fost găsit',
    INVALID_CHAPTER_ID: 'ID-ul capitolului este invalid',
    INVALID_QUESTION_ID: 'ID-ul întrebării este invalid',
    QUESTION_NOT_FOUND: 'Întrebarea nu a fost găsită',
    INVALID_SIGN_CATEGORY: 'Categorie de semne invalidă',
    SIGN_CATEGORY_NOT_FOUND: 'Categoria de semne nu a fost găsită',
    INVALID_QUESTION_CATEGORY_ID: 'ID-ul categoriei întrebărilor este invalid',
    NO_MORE_QUESTIONS_FOR_CATEGORY: 'Nu mai sunt întrebări pentru categorie',
    NO_MORE_INCORRECTLY_SOLVED_QUESTIONS:
        'Nu mai sunt întrebări rezolvate incorect',
    UNAUTHENTICATED: 'Neautentificat',
    INVALID_COMPARISON_CATEGORY_ID: 'ID-ul categoriei comparației este invalid',
    COMPARISON_CATEGORY_NOT_FOUND: 'Categoria comparației nu a fost găsită',
    INVALID_COMPARISON_ID: 'ID-ul comparației este invalid',
    COMPARISON_NOT_FOUND: 'Comparația nu a fost găsită',
    UNAUTHORIZED: 'Neautorizat',
    INVALID_CREDENTIALS: 'Credențiale invalide',
    INVALID_USER_ID: 'ID-ul utilizatorului este invalid',
    QUESTION_ID_NOT_IN_BODY: 'ID-ul întrebării nu este în corp',
    INVALID_ANSWER_FORMAT: 'Formatul răspunsului este invalid',
    ANSWER_ID_TOO_HIGH: 'ID-ul răspunsului este prea mare',
    ANSWER_ID_TOO_LOW: 'ID-ul răspunsului este prea mic',
    REPEATED_ANSWER_IDS: 'ID-urile răspunsurilor se repetă',
    INVALID_JSON_INPUT: 'Input JSON invalid',
    ANSWER_ID_NOT_IN_BODY: 'ID-ul răspunsului nu este în corp',
    INVALID_ANSWER_ID: 'ID-ul răspunsului este invalid',
    NO_USER_QUESTIONNAIRE: 'Nu există chestionar pentru utilizator',
};

export const errors = Object.fromEntries(
    Object.entries(ErrorCodes).map(([key, value]) => [
        value,
        errorMessages[key],
    ])
);

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
    if (errorData?.body?.errorCode) {
        return getErrorMessageFromCode(errorData?.body?.errorCode);
    }
    // assume errorData is in and of itself the errorCode
    return getErrorMessageFromCode(errorData);
};

export const renderErrorMessage = (errorMessage) => {
    let errorInfoContainer = document.createElement('div');
    errorInfoContainer.className = 'error__info';

    let mainMessage = document.createElement('p');
    mainMessage.textContent = 'A intervenit o eroare:';
    errorInfoContainer.appendChild(mainMessage);

    let errorDetails = document.createElement('p');
    errorDetails.className = 'error__details';
    try {
        errorDetails.innerText = errorMessage;
        errorInfoContainer.appendChild(errorDetails);
    } catch (e) {
        console.log(e);
    }

    return errorInfoContainer;
};

export const renderError = (errorData) => {
    return renderErrorMessage(getErrorMessage(errorData));
};
