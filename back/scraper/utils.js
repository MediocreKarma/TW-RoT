import { DOMParser } from 'xmldom';
import https from 'https';

export const silencedDOMParserOptions = {
    locator: {},
    errorHandler: {
        warning: function (w) {},
        error: function (e) {},
        fatalError: function (e) {
            console.error(e);
        },
    },
};

function getContentUtil(url, resolve, reject) {
    https.get(url, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
            return getContentUtil(res.headers.location, resolve, reject);
        }

        let body = [];

        res.on('data', (chunk) => {
            body.push(chunk);
        });

        res.on('end', () => {
            try {
                resolve(Buffer.concat(body).toString());
            } catch (err) {
                reject(err);
            }
        });
    });
}

export async function getContent(url) {
    return new Promise((resolve, reject) =>
        getContentUtil(url, resolve, reject)
    );
}

function getFinalUrlUtil(url, resolve, reject) {
    https
        .get(url, (res) => {
            console.log('utils final url ' + url);
            if (res.statusCode === 301 || res.statusCode === 302) {
                return getFinalUrlUtil(res.headers.location, resolve, reject);
            }

            resolve(url);
        })
        .on('error', (err) => {
            reject(err);
        });
}

export async function getFinalUrl(url) {
    // return new Promise((resolve, reject) =>
    //     getFinalUrlUtil(url, resolve, reject)
    // );
    return url;
}

export const stringToKebabCase = (string) =>
    string
        .toLowerCase()
        .replace(/[ăâ]/g, 'a') // replace ă and â with a
        .replace(/[șş]/g, 's') // replace s-comma and s-cedilla with s
        .replace(/[ţț]/g, 't') // replace t-comma and t-cedilla with t
        .replace(/[î]/g, 'i') // replace i circumflex with i
        .replace(/[^\w\s]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

export const romanNumeralToInt = (numeral) => {
    const ROMAN_HASH = {
        M: 1000,
        D: 500,
        C: 100,
        L: 50,
        X: 10,
        V: 5,
        I: 1,
    };
    let number = 0;
    for (let i = 0; i < numeral.length - 1; i++) {
        if (ROMAN_HASH[numeral[i]] < ROMAN_HASH[numeral[i + 1]]) {
            number -= ROMAN_HASH[numeral[i]];
        } else {
            number += ROMAN_HASH[numeral[i]];
        }
    }
    return number + ROMAN_HASH[numeral[numeral.length - 1]];
};
