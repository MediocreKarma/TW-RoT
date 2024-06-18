import { WebServer } from './webServer.js';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config({
     path: join(dirname(fileURLToPath(import.meta.url)), '../.env'),
});
dotenv.config({
    path: join(dirname(fileURLToPath(import.meta.url)), '.env'),
});

const FRONT = process.env.FRONT;
const server = new WebServer();

server.setNotFoundRoute('/not-found', `${FRONT}/pages/not-found/index.html`);

server.addFixedRoute('/favicon.ico', `${FRONT}/static/img/favicon.ico`);

server.addDynamicRoute(
    '/cod-rutier/capitol/:id',
    `${FRONT}/pages/cod-rutier/_capitol.html`
);
server.addDynamicRoute(
    '/indicatoare/categorie/:id',
    `${FRONT}/pages/indicatoare/_id.html`
);

server.addWildcardRoute('/components/*', `${FRONT}/components`);
server.addWildcardRoute('/img/*', `${FRONT}/static/img`);
server.addWildcardRoute('/docs/*', `${FRONT}/documentation`);
server.addWildcardRoute('/js/*', `${FRONT}/static/js`);
server.addWildcardRoute('/style/*', `${FRONT}/static/css`);
server.addWildcardRoute('/*', `${FRONT}/pages`);

server.listen(12734, 'localhost');
