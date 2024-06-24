import API from '/js/api.js';
import { post } from '/js/requests.js';

import { USER_ROLES } from '/js/constants.js';

export const UserData = {
    id: 'userId',
    username: 'userUsername',
    flags: 'userFlags',
    questionnaire: 'userQuestionnaire',
};

const isAuthenticated = async () => {
    try {
        const response = await post(`${API.AUTH}/auth/authenticated`, null);
        console.log(response);
        return await response.json();
    } catch (e) {
        if (e?.status === 401 || e?.status === 403) {
            clearUserData();
        }
        if (e?.status === 403) {
            window.location.href = '/banned';
            return {};
        }
        throw e;
    }
};

export const cachedUserData = () => {
    const id = localStorage.getItem(UserData.id);
    const username = localStorage.getItem(UserData.username);
    const flags = localStorage.getItem(UserData.flags);

    return id && username && flags
        ? {
              id,
              username,
              flags,
          }
        : null;
};

export const userData = async () => {
    // uncached user data.
    // make a request to /authenticated, return the results, save what I absolutely need to localStorage cache
    try {
        const userData = await isAuthenticated();
        setUserData(userData.user);
        return userData.user;
    } catch (e) {
        if (e?.status === 403) {
            window.location.href = '/banned';
        }
        return null;
    }
};

export const isLoggedIn = () => {
    return cachedUserData() ? true : false;
};

export const isAdmin = (flags) => {
    return (Number.isInteger(flags)
        ? flags
        : parseInt(cachedUserData().flags, 10)) === USER_ROLES.ADMIN
        ? true
        : false;
};

export const isBanned = (flags) => {
    return (Number.isInteger(flags)
        ? flags
        : parseInt(cachedUserData().flags, 10)) === USER_ROLES.BANNED
        ? true
        : false;
};

export const clearUserData = () => {
    localStorage.removeItem(UserData.id);
    localStorage.removeItem(UserData.username);
    localStorage.removeItem(UserData.flags);
    localStorage.removeItem(UserData.questionnaire);
};

export const setUserData = (user) => {
    localStorage.setItem(UserData.id, user.id);
    localStorage.setItem(UserData.username, user.username);
    localStorage.setItem(UserData.flags, user.flags);
};
