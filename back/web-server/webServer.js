import { Server } from 'https';
import { zip } from '../common/utils.js';
import { parse } from 'node:url';
import {
    sendEmptyResponse,
    sendJsonResponse,
    sendFileResponse,
} from '../common/response.js';
import { ErrorCodes } from '../common/constants.js';
import fs from 'fs';
import path from 'path';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';

const getCWD = () => {
    return dirname(fileURLToPath(import.meta.url));
};

export class WebServer extends Server {
    constructor() {
        super(
            {
                key: fs.readFileSync(getCWD() + '/../common/localhost-key.pem'), 
                cert: fs.readFileSync(getCWD() + '/../common/localhost.pem'), 
            },
            (req, res) => this.requestHandler(req, res)
        );
        this.notFoundRoute = null;
        this.fixedRoutes = new Map();
        this.dynamicRoutes = new Map();
        this.wildcardRoutes = new Map();
    }

    setNotFoundRoute(route, redirect) {
        this.addFixedRoute(route, redirect); // if user goes to "not-found"...
        this.notFoundRoute = {
            route,
            redirect,
        };
    }

    addFixedRoute(route, redirect) {
        if (route.includes('*')) {
            throw new Error(
                'Fixed route cannot contain wildcard character (*)'
            );
        }
        if (route.includes(':')) {
            throw new Error(
                'Fixed route cannot contain dynamic route character (:)'
            );
        }
        this.fixedRoutes.set(route, redirect);
    }

    addDynamicRoute(route, redirect) {
        this.dynamicRoutes.set(route, redirect);
    }

    addWildcardRoute(route, redirectPrefix) {
        this.wildcardRoutes.set(route, redirectPrefix);
    }

    async requestHandler(req, res) {
        const method = req.method.toUpperCase();
        const { pathname } = parse(req.url, false);

        console.log(`Received request ${method} ${pathname}`);

        if (method === 'OPTIONS') {
            sendEmptyResponse(res, 204);
            return;
        }

        if (method !== 'GET') {
            sendJsonResponse(res, 405, {
                errorCode: ErrorCodes.INVALID_METHOD,
                errorMessage: `Method ${method} is not allowed`,
            });
            return;
        }

        for (const [route, filepath] of this.fixedRoutes) {
            if (!this.matchFixedRoute(route, pathname)) {
                continue;
            }

            if (this.serveFile(filepath, res)) {
                return;
            }

            return;
        }

        for (const [route, filepath] of this.dynamicRoutes) {
            const pathParams = this.matchDynamicRoute(route, pathname);
            if (pathParams === null) {
                continue;
            }
            console.log(filepath);

            if (this.serveFile(filepath, res)) {
                return;
            }

            return;
        }

        for (const [route, prefix] of this.wildcardRoutes) {
            if (!this.matchWildcardRoute(route, pathname)) {
                continue;
            }
            const replacedString = route.substring(0, route.lastIndexOf('/*'));
            const filepath = pathname.replace(replacedString, prefix);
            if (this.serveWildcardFile(filepath, res)) {
                return;
            }
        }

        this.serveFile(this.notFoundRoute.redirect, res, 404);
    }

    matchFixedRoute(route, url) {
        return url === route;
    }

    matchDynamicRoute(route, url) {
        const splitRoute = route.split('/');
        const splitUrl = url.split('/');

        if (splitRoute.length !== splitUrl.length) {
            return null;
        }

        const params = {};

        for (const [routePart, urlPart] of zip(splitRoute, splitUrl)) {
            if (routePart.startsWith(':')) {
                params[routePart.slice(1)] = urlPart;
            } else if (routePart !== urlPart) {
                return null;
            }
        }
        return params;
    }

    matchWildcardRoute(route, url) {
        const splitRoute = route.split('/');
        const splitUrl = url.split('/');

        // disallow any wildcard path containing '..'
        if (splitUrl.includes('..')) {
            return false;
        }

        for (const [routePart, urlPart] of zip(splitRoute, splitUrl)) {
            if (routePart === '*') {
                return true;
            }
            if (routePart !== urlPart) {
                return false;
            }
        }
    }

    getIdFromAuthorization(req) {
        const authHeader = req.headers['authorization'];
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.split(' ')[1];
    }

    getContentType(filename) {
        const extension = filename.substring(filename.lastIndexOf('.') + 1);
        switch (extension) {
            case 'css':
                return 'text/css';
            case 'js':
                return 'application/javascript';
            case 'json':
                return 'application/json';
            case 'yml':
                return 'application/x-yaml';
            case 'html':
                return 'text/html';
            case 'jpg':
                return 'image/jpeg';
            case 'jpeg':
                return 'image/jpeg';
            case 'png':
                return 'image/png';
            default:
                return 'text/plain';
        }
    }

    serveWildcardFile(filepath, res, statusCode = 200) {
        const isBlacklisted = (filePath) => {
            const normalizedPath = path.normalize(filePath);
            const extension = path.basename(normalizedPath);
            return extension.startsWith('_');
        };
        const hasExtension = (filePath) => {
            const normalizedPath = path.normalize(filePath);
            const extension = path.extname(normalizedPath);
            return extension !== '';
        };

        try {
            // if filePath has no extension, add HTML extension
            // TODO: figure out whether this introduces a vulnerability
            const sanitizedFilepath = filepath.replace(/\/+$/, '');

            if (isBlacklisted(sanitizedFilepath)) {
                return false;
            }

            const variants = [
                sanitizedFilepath,
                ...(!hasExtension(sanitizedFilepath) &&
                sanitizedFilepath
                    .substring(sanitizedFilepath.lastIndexOf('/') + 1)
                    .toLowerCase() !== 'index'
                    ? [
                          sanitizedFilepath + '.html',
                          sanitizedFilepath + '/index.html',
                      ]
                    : []),
            ];
            for (let i = 0; i < variants.length; ++i) {
                const variant = variants[i];
                try {
                    if (this.serveFile(variant, res, statusCode)) {
                        return true;
                    }
                } catch (err) {
                    if (i === variants.length - 1) {
                        throw err;
                    }
                }
            }
        } catch (err) {
            console.log(err.message);
            return false;
        }
    }

    serveFile(filepath, res, statusCode = 200) {
        console.log(filepath);
        const file = fs.readFileSync(filepath);
        const contentType = this.getContentType(filepath);
        sendFileResponse(res, statusCode, file, contentType);
        return true;
    }
}
