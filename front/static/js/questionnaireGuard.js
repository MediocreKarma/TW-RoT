import { isLoggedIn, UserData, cachedUserData } from './auth.js';

import API from '/js/api.js';
import { get } from '/js/authRequests.js';

const getQuestionnaire = async (userId) => {
    const response = await get(
        `${API.EXERCISES}/users/${userId}/questionnaire`
    );
    return await response.json();
};

if (isLoggedIn()) {
    let hasQuestionnaire = false;

    const questionnaire = localStorage.getItem(UserData.questionnaire);
    if (!questionnaire) {
        try {
            const questionnaire = await getQuestionnaire(cachedUserData().id);
            if (questionnaire?.questionnaire?.registered === false) {
                hasQuestionnaire = true;
            }
        } catch (e) {
            // mute error
        }
    } else {
        try {
            const data = JSON.parse(questionnaire);
            if (data?.questionnaire?.registered === false) {
                hasQuestionnaire = true;
            }
        } catch (e) {}
    }

    if (hasQuestionnaire) {
        window.location.href = '/exercises/questionnaire';
    }
}
