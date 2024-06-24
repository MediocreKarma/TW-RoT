import { ErrorCodes } from '/js/constants.js';

export const errorMessages = {
    SERVER_ERROR: 'Eroare internă',
    INVALID_METHOD: 'Metodă invalidă',
    ROUTE_NOT_FOUND: 'Rută inexistentă',
    USERNAME_NOT_IN_BODY: 'Numele de utilizator nu a fost furnizat',
    USERNAME_TOO_SHORT: 'Numele de utilizator este prea scurt',
    USERNAME_TOO_LONG: 'Numele de utilizator este prea lung',
    USERNAME_ALREADY_EXISTS: 'Numele de utilizator există deja',
    EMAIL_NOT_IN_BODY: 'Emailul nu a fost furnizat',
    BAD_EMAIL: 'Email invalid',
    PASSWORD_NOT_IN_BODY: 'Parola nu a fost furnizată',
    PASSWORD_TOO_SHORT: 'Parola este prea scurtă',
    PASSWORD_TOO_LONG: 'Parola este prea lungă',
    USERNAME_INVALID_CHARS: 'Numele de utilizator conține caractere invalide',
    VERIFICATION_TOKEN_NOT_IN_BODY: 'Tokenul de verificare a fost furnizat',
    INVALID_VERIFICATION_TOKEN: 'Tokenul de verificare este invalid',
    EXPIRED_VERIFICATION_TOKEN: 'Tokenul de verificare a expirat',
    CHANGE_TYPE_NOT_IN_BODY: 'Tipul de schimbare nu a fost furnizat',
    CHANGE_TYPE_INCORRECT: 'Tipul de schimbare este incorect',
    CHANGE_REQUEST_TOKEN_NOT_IN_BODY:
        'Codul de solicitare a schimbării nu a fost furnizat',
    INVALID_CHANGE_REQUEST_TOKEN:
        'Codul de solicitare a schimbării este invalid',
    EXPIRED_CHANGE_REQUEST_TOKEN: 'Codul de solicitare a schimbării a expirat',
    COOKIE_HEADER_NOT_FOUND: 'Neautentificat',
    AUTH_COOKIE_NOT_FOUND: 'Neautentificat',
    AUTH_COOKIE_INVALID: 'Autentificare invalidă',
    INVALID_IMAGE_ID: 'ID-ul imaginii este invalid',
    TRAFFIC_SIGNS_IMAGE_NOT_FOUND:
        'Imaginea cu semne de circulație nu a fost găsită',
    CHAPTER_NOT_FOUND: 'Capitolul nu a fost găsit',
    INVALID_CHAPTER_ID: 'ID-ul capitolului este invalid',
    INVALID_QUESTION_ID: 'ID-ul întrebării este invalid',
    QUESTION_NOT_FOUND: 'Întrebarea nu a fost găsită',
    INVALID_SIGN_CATEGORY: 'Categorie de semne invalidă',
    SIGN_CATEGORY_NOT_FOUND: 'Categoria de semne nu a fost găsită',
    INVALID_QUESTION_CATEGORY_ID: 'ID-ul categoriei de întrebări este invalid',
    NO_MORE_QUESTIONS_FOR_CATEGORY:
        'Nu mai sunt întrebări pentru această categorie',
    NO_MORE_INCORRECTLY_SOLVED_QUESTIONS:
        'Nu mai sunt întrebări rezolvate incorect',
    UNAUTHENTICATED: 'Neautentificat',
    INVALID_COMPARISON_CATEGORY_ID:
        'ID-ul categoriei de comparație este invalid',
    COMPARISON_CATEGORY_NOT_FOUND: 'Categoria de comparație nu a fost găsită',
    INVALID_COMPARISON_ID: 'ID-ul comparației este invalid',
    COMPARISON_NOT_FOUND: 'Comparația nu a fost găsită',
    UNAUTHORIZED: 'Neautorizat',
    INVALID_CREDENTIALS: 'Credențiale invalide',
    INVALID_USER_ID: 'ID-ul utilizatorului este invalid',
    QUESTION_ID_NOT_IN_BODY: 'ID-ul întrebării nu a fost furnizat',
    ANSWER_MISSING_BOOLEAN_PROPERTY:
        'Răspunsul pentru o întrebare trebuie să fie adevărat sau fals',
    ANSWER_ID_TOO_HIGH: 'ID-ul răspunsului este prea mare',
    ANSWER_ID_TOO_LOW: 'ID-ul răspunsului este prea mic',
    REPEATED_ANSWER_IDS: 'ID-uri de răspuns repetate',
    INVALID_JSON_INPUT: 'Input JSON invalid',
    ANSWER_ID_NOT_IN_BODY: 'ID-ul răspunsului nu a fost furnizat',
    INVALID_ANSWER_ID: 'ID-ul răspunsului este invalid',
    NO_USER_QUESTIONNAIRE: 'Chestionar utilizator inexistent',
    QUESTION_ID_NOT_IN_QUESTIONNAIRE: 'ID-ul întrebării nu este în chestionar',
    QUESTION_SOLUTION_ALREADY_SUBMITTED:
        'Soluția întrebării a fost deja trimisă',
    NO_COOKIE_OR_EMAIL: 'Nu există cookie sau email',
    START_NOT_INTEGER: 'Startul nu este un număr întreg',
    COUNT_NOT_INTEGER: 'Numărul nu este un număr întreg',
    START_NOT_NONNEGATIVE_INTEGER: 'Startul nu este un număr întreg nenegativ',
    COUNT_NOT_NONNEGATIVE_INTEGER: 'Numărul nu este un număr întreg nenegativ',
    BANNED_STATUS_NOT_IN_BODY: 'Statusul de restricționare nu a fost furnizat',
    INVALID_BANNED_STATUS: 'Statusul de restricționare este invalid',
    NO_BANNABLE_USER_FOUND: 'Nu a fost găsit niciun utilizator banabil',
    BANNED: 'Banned',
    ANSWERS_NOT_IN_BODY: 'Nu au fost furnizate răspunsurile',
    QUESTION_ID_NOT_FOUND: 'ID-ul întrebării nu a fost găsit',
    QUESTION_BODY_NOT_FOUND: 'Corpul întrebării nu a fost găsit',
    MISSING_CATEGORY_FROM_QUESTION: 'Întrebarea are categorie lipsă',
    INVALID_CATEGORY_ID: 'ID-ul categoriei este invalid',
    MISSING_TEXT_FROM_QUESTION: 'Textul întrebării lipsește',
    CATEGORY_ID_AND_CATEGORY_TITLE_GIVEN:
        'Au fost furnizate simultan atât ID-ul unei categorii existente, cât și un titlu pentru o categorie nouă',
    QUESTION_CATEGORY_NOT_FOUND: 'Categoria întrebării nu a fost găsită',
    CATEGORY_ALREADY_EXISTS: 'Există deja o categorie cu acest titlu',
    ANSWER_MISSING_DESCRIPTION: 'Descrierea lipsește din răspuns',
    TOO_FEW_ANSWER_OPTIONS: 'Prea puține opțiuni de răspuns',
    CATEGORY_TITLE_TOO_LONG: 'Titlul categoriei este prea lung',
    DESCRIPTION_TOO_LONG: 'Descrierea este prea lungă',
    INVALID_QUESTION_FORMAT: 'Formatul întrebării este invalid',
};

export const errors = Object.fromEntries(
    Object.entries(ErrorCodes).map(([key, value]) => [
        value,
        errorMessages[key],
    ])
);

export const getErrorMessageFromCode = (errorCode) => {
    console.log(errorCode);
    if (errorCode in errors && errors[errorCode]) {
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
