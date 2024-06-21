import { userData, cachedUserData, clearUserData } from '/js/auth.js';
import { renderMessage, showLoading } from '/js/render.js';
import { renderError } from '/js/errors.js';
import { showInfoModal, showConfirmModal } from '/js/modals.js';

import { deleteAccount, requestChange, resetProgress } from './requests.js';

const credentialButtonListener = async (event) => {
    try {
        let button = event.target;
        // wait for confirmation
        const type = button.getAttribute('__type');

        const changeTypeString = (() => {
            switch (type) {
                case 'email':
                    return 'email-ul';
                case 'username':
                    return 'numele de utilizator';
                case 'password':
                    return 'parola';
                default:
                    return null;
            }
        })();
        if (!changeTypeString) {
            return;
        }

        const confirmed = await showConfirmModal(
            renderMessage(`Sigur doriți să vă schimbați ${changeTypeString}?`)
        );
        if (!confirmed) {
            return;
        }

        button.disabled = true;
        await requestChange(button.getAttribute('__type'));

        showInfoModal(
            renderMessage(
                'Veți primi în scurt timp un email de confirmare a schimbării dorite, pe adresa de email asociată contului.'
            )
        );
        button.disabled = false;
    } catch (e) {
        showInfoModal(renderError(e));
    }
};

const addListenersToChangeCredentialButtons = () => {
    const buttons = document.querySelectorAll('button[__type]');
    buttons.forEach((button) => {
        button.addEventListener('click', credentialButtonListener);
    });
};

const addListenerToDeleteAccountButton = () => {
    const deleteButton = document.getElementById('delete-account');

    deleteButton.addEventListener('click', async () => {
        const confirmed = await showConfirmModal(
            renderMessage(
                `Sigur doriți să vă ștergeți contul? ACEASTA ESTE O ACȚIUNE IREVERSIBILĂ.`
            )
        );

        if (!confirmed) {
            return;
        }

        deleteButton.disabled = true;
        try {
            const userData = cachedUserData();
            await deleteAccount(userData.id);
            clearUserData();
            window.location.href = '/';
        } catch (e) {
            showInfoModal(renderError(e));
        }
    });
};

const addListenerToResetProgressButton = () => {
    const resetButton = document.getElementById('reset-progress');

    resetButton.addEventListener('click', async () => {
        const confirmed = await showConfirmModal(
            renderMessage(
                `Sigur doriți să vă resetați progresul? ACEASTA ESTE O ACȚIUNE IREVERSIBILĂ.`
            )
        );

        if (!confirmed) {
            return;
        }

        resetButton.disabled = true;
        try {
            const userData = cachedUserData();
            await resetProgress(userData.id);
            showUserData();
            showInfoModal(renderMessage('Progresul a fost resetat cu succes.'));
        } catch (e) {
            showInfoModal(renderError(e));
        } finally {
            resetButton.disabled = false;
        }
    });
};

const showUserData = async () => {
    let username = document.getElementById('username');
    let correctPercentage = document.getElementById(
        'progress-correct-percentage'
    );

    let correctNumber = document.getElementById('progress-correct-questions');
    let wrongNumber = document.getElementById('progress-wrong-questions');
    let questionnaires = document.getElementById(
        'progress-passed-questionnaires'
    );

    let fields = [
        username,
        correctPercentage,
        correctNumber,
        wrongNumber,
        questionnaires,
    ];

    try {
        fields.forEach((field) => {
            showLoading(field);
        });
        const user = await userData();

        username.innerText = user.username;
        correctNumber.innerText = user.solvedQuestions;
        wrongNumber.innerText = user.totalQuestions - user.solvedQuestions;
        questionnaires.innerText = user.solvedQuestionnaires;
        correctPercentage.innerText = (
            user.totalQuestions === 0
                ? 0
                : (user.solvedQuestions / user.totalQuestions) * 100
        ).toFixed(2);
    } catch (e) {
        showInfoModal(renderError(e));
        fields.forEach((field) => {
            field.innerText = 'Eroare';
        });
    }
};

window.addEventListener('load', () => {
    addListenersToChangeCredentialButtons();
    addListenerToDeleteAccountButton();
    addListenerToResetProgressButton();
    showUserData();
});
