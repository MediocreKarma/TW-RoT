import { createQuestionnaire, getQuestionnaire } from './utils.js';
import { ErrorCodes } from '/js/constants.js';
import { showInfoModal } from '/js/modals.js';
import { renderError } from '/js/errors.js';

window.addEventListener('load', async () => {
    let questionnaireData;
    try {
        questionnaireData = await getQuestionnaire();
    } catch (e) {
        if (e?.body?.errorCode !== ErrorCodes.NO_USER_QUESTIONNAIRE) {
            // cam asta-i singurul caz pertinent in care chiar pot face ceva
            showInfoModal(renderError(e));
        }
    }

    if (questionnaireData?.questionnaire?.registered === true) {
        window.location.href = '/exercises/questionnaire/results'; // TODO
    }

    if (!questionnaireData) {
        // try creating questionnaire if not exists
        try {
            await createQuestionnaire();
        } catch (e) {
            showInfoModal(renderError(e), () => {
                window.location.href = '/exercises'; // nu prea am ce face
            });
        }
    }

    console.log(questionnaireData);
});
