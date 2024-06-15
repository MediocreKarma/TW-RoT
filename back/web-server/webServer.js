import { Server } from 'http';
import { zip } from '../common/utils.js';
import { parse } from "node:url";
import { sendEmptyResponse, sendJsonResponse, sendFileResponse } from "../common/response.js";
import { ErrorCodes } from "../common/constants.js";
import fs from 'fs';


export class WebServer extends Server {
    constructor() {
        super((req, res) => this.requestHandler(req, res));
        this.parametrizedRoutes = new Map();
        this.wildcardRoutes = new Map();
    }

    addParametrizedRoute(route, redirect) {
        this.parametrizedRoutes.set(route, redirect);
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

        for (const [route, filepath] of this.parametrizedRoutes) {
            const pathParams = this.matchParametrizedRoute(
                route,
                pathname,
            );
            if (pathParams === null) {
                continue;
            }

            // aici adaugi tu cum consideri

            handler(req, res, params);
            return;
        }

        for (const [route, prefix] of this.wildcardRoutes) {
            if (!this.matchWildcardRoute(route, pathname)) {
                continue;
            }
            const replacedString = route.substring(0, route.lastIndexOf('/*'));
            const filepath = pathname.replace(replacedString, prefix);
            if (this.serveFile(filepath, res)) {
                return;
            }
        }

        sendJsonResponse(res, 404, {
            errorCode: ErrorCodes.ROUTE_NOT_FOUND,
            errorMessage: `Route ${pathname} not found`,
        });
    }

    matchParametrizedRoute(route, url) {
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
            case 'css': return 'text/css';
            case 'js': return 'application/javascript';
            case 'json': return 'application/json';
            case 'yml': return 'application/x-yaml';
            case 'html': return 'text/html';
            case 'jpg': 
            case 'jpeg': return 'image/jpeg';
            case 'png': return 'image/png';
            default: return 'text/plain';
        }
    }

    serveFile(filepath, res) {
        console.log(filepath);
        try {
            const contentType = this.getContentType(filepath);
            const file = fs.readFileSync(filepath);
            sendFileResponse(res, 200, file, contentType);
            return true;
        } catch (err) {
            console.log(err.message);
            return false;
        }
    }
}
