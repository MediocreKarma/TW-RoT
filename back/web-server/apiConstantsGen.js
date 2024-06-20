import { readFileSync, writeFileSync } from 'fs';

import dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '../.env'),
});
dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '.env'),
});

export function initApiJs() {
    const filename = 'api.js';
    const templatePath = filename + '.template';
    let templateFileStr = readFileSync(templatePath, 'utf8');

    templateFileStr = templateFileStr
        .replace(/{CHAPTERS_PORT}/g, process.env.CHAPTERS_PORT)
        .replace(/{TRAFFIC_SIGNS_PORT}/g, process.env.TRAFFIC_SIGNS_PORT)
        .replace(/{EXERCISES_PORT}/g, process.env.EXERCISES_PORT)
        .replace(/{USERS_PORT}/g, process.env.USERS_PORT)
        .replace(/{AUTH_PORT}/g, process.env.AUTH_PORT);

    writeFileSync(
        `${process.env.FRONTEND_PATH}/static/js/${filename}`,
        templateFileStr
    );

    console.log(
        `Placeholders in ${filename} have been replaced with actual port numbers.`
    );
}

export function copyConstants() {
    const filePath = '../common/constants.js';
    let fileStr = readFileSync(filePath, 'utf8');
    writeFileSync(
        `${process.env.FRONTEND_PATH}/static/js/constants.js`,
        fileStr
    );
    console.log(
        `Pasted ${filePath} to ${`${process.env.FRONTEND_PATH}/static/js/constants.js`}.`
    );
}
