import { Server } from 'http';
import { zip } from './utils.js';
import { parse } from "node:url";
import {sendEmptyResponse, sendJsonResponse} from "./response.js";
import {ErrorCodes} from "./constants.js";

export const Methods = Object.freeze({
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
});

export class RestServer extends Server {
    routes = new Map([
        [Methods.GET, new Map()],
        [Methods.POST, new Map()],
        [Methods.PUT, new Map()],
        [Methods.DELETE, new Map()],
        [Methods.PATCH, new Map()],
    ]);

    constructor() {
        super();
        this.on('request', this.requestHandler);
    }

    registerRoute(method, route, handler) {
        const routeMethods = this.routes.get(method);
        if (!routeMethods) {
            throw new Error(`Route ${method} not found`);
        }
        this.routes.get(method).set(route, handler);
    }

     requestHandler(req, res) {
        const method = req.method.toUpperCase();
        const pathname = parse(req.url, true).pathname;

        if (method === 'OPTIONS') {
            sendEmptyResponse(res, 204);
            return;
        }

        const methodHandlers = this.routes.get(method);

        if (!methodHandlers) {
            sendJsonResponse(res, 405, {
                errorCode: ErrorCodes.INVALID_METHOD,
                errorMessage: `Method ${method} is not allowed`,
            });
        }

        for (const [route, handler] of methodHandlers) {
            const pathParams = this.matchRoute(
                route,
                pathname,
            );
            if (pathParams === null) {
                continue;
            }
            handler(req, res, pathParams);
            return;
        }

        sendJsonResponse(res, 404, {
            errorCode: ErrorCodes.ROUTE_NOT_FOUND,
            errorMessage: `Route ${pathname} not found`,
        });
    }

    matchRoute(route, url) {
        const splitRoute = route.split('/');
        const splitUrl = url.split('/');

        if (splitRoute.length !== splitUrl.length) {
            return null;
        }

        const pathParams = {};
        for (const [routePart, urlPart] of zip(splitRoute, splitUrl)) {
            if (routePart.startsWith(':')) {
                pathParams[routePart.slice(1)] = urlPart;
            } else if (routePart !== urlPart) {
                return null;
            }
        }

        return pathParams;
    }
}
