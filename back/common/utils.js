import { USER_ROLES } from "./constants.js";

export function zip(arr1, arr2) {
    return arr1.map((element, index) => [element, arr2[index]]);
}

export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}

export const isStringValidInteger = (str) => {
    const parsed = parseInt(str, 10);
    return !isNaN(parsed) && parsed.toString() === str;
};

export const isBanned = (authorization) => {
    const flags = authorization?.user?.flags ?? USER_ROLES.USER;
    return !!(flags & USER_ROLES.BANNED);
}

export const isAdmin = (authorization) => {
    const flags = authorization?.user?.flags ?? USER_ROLES.BANNED;
    return (flags & USER_ROLES.ADMIN) === 1 && (flags & USER_ROLES.BANNED) === 0;
}


