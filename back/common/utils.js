import { USER_ROLES } from "./constants.js";
import fs from 'fs';
import { parse } from 'csv-parse';

/**
 * zip function similar to default python api
 * 
 * @param {*} arr1 
 * @param {*} arr2 
 * @returns 
 */
export function zip(arr1, arr2) {
    return arr1.map((element, index) => [element, arr2[index]]);
}

/**
 * Sleep function similar to other languages
 * 
 * @param {*} ms timeout in milliseconds
 * @returns a promise with a timeout in Math.max(ms, 0) milliseconds.
 * Await to simulate sleep
 */
export async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, Math.max(ms, 0)));
}

/**
 * validator function for valid integers
 */
export const isStringValidInteger = (str) => {
    const parsed = parseInt(str, 10);
    return !isNaN(parsed) && parsed.toString() === str;
};

/**
 * given an authorization object, verify if the
 * user is banned or not
 * 
 * @param {*} authorization 
 * @returns true if BANNED, false if authorization object is bad or not BANNED 
 */
export const isBanned = (authorization) => {
    const flags = authorization?.user?.flags ?? USER_ROLES.USER;
    return !!(flags & USER_ROLES.BANNED);
}

/**
 * given an authorization object, verify if the
 * user is an admin or not
 * 
 * @param {*} authorization 
 * @returns true if ADMIN, false if authorization object is bad or not ADMIN 
 */
export const isAdmin = (authorization) => {
    const flags = authorization?.user?.flags ?? USER_ROLES.BANNED;
    return (flags & USER_ROLES.ADMIN) !== 0 && (flags & USER_ROLES.BANNED) === 0;
}

/**
 * parse a csv into an array of results from
 * a given filepath
 * 
 * @param {*} filepath - filepath of the csv 
 * @returns 
 */
export const parseCSV = (filepath) => {
    return new Promise((resolve, reject) => {
        const results = [];

        fs.createReadStream(filepath)
            .pipe(parse({columns: true}))
            .on('data', (row) => {
                results.push(row);
            })
            .on('end', () => {
                resolve(results);
            })
            .on('error', (err) => {
                reject(err);
            });
    });
}