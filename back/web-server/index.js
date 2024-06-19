import { WebServer } from './webServer.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';

import initOpenApi from './openapiGen.js';
import initApiJs from './apiConstantsGen.js';

import dotenv from 'dotenv';

dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '../.env'),
});
dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '.env'),
});

initOpenApi();
initApiJs();

const FRONT = process.env.FRONTEND_PATH;
const server = new WebServer();

server.setNotFoundRoute('/not-found', `${FRONT}/pages/not-found/index.html`);

server.addFixedRoute('/favicon.ico', `${FRONT}/static/img/favicon.ico`);

server.addDynamicRoute(
    '/traffic-code/chapter/:id',
    `${FRONT}/pages/traffic-code/_chapter.html`
);
server.addDynamicRoute(
    '/traffic-signs/category/:id',
    `${FRONT}/pages/traffic-signs/_id.html`
);

server.addWildcardRoute('/components/*', `${FRONT}/components`);
server.addWildcardRoute('/img/*', `${FRONT}/static/img`);
server.addWildcardRoute('/docs/*', `${FRONT}/documentation`);
server.addWildcardRoute('/js/*', `${FRONT}/static/js`);
server.addWildcardRoute('/style/*', `${FRONT}/static/css`);
server.addWildcardRoute('/*', `${FRONT}/pages`);

server.listen(12734, 'localhost');
