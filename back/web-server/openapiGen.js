import { readFileSync, writeFileSync } from 'fs';
import { load, dump } from 'js-yaml';

import dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '../.env') });

const filename   = 'openapi.yml';
const templatePath = filename + '.template';
const openapiSpec = load(readFileSync(templatePath, 'utf8'));

let openapiSpecStr = dump(openapiSpec);

openapiSpecStr = openapiSpecStr.replace(/{CHAPTERS_PORT}/g, process.env.CHAPTERS_PORT);
openapiSpecStr = openapiSpecStr.replace(/{TRAFFIC_SIGNS_PORT}/g, process.env.TRAFFIC_SIGNS_PORT);
openapiSpecStr = openapiSpecStr.replace(/{EXERCISES_PORT}/g, process.env.EXERCISES_PORT);
openapiSpecStr = openapiSpecStr.replace(/{USERS_PORT}/g, process.env.USERS_PORT);
openapiSpecStr = openapiSpecStr.replace(/{AUTH_PORT}/g, process.env.AUTH_PORT);

writeFileSync(`../../front/swagger-ui/${filename}`, openapiSpecStr);

console.log('Placeholders have been replaced with actual port numbers.');
