const { Server } = require('http');
const url = require('url');
const { zip } = require('./utils');

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
        if (!(method in this.routes)) {
            throw 'Invalid Route';
        }
        this.routes.get(method).set(route, handler);
    }

    requestHandler(req, res) {
        const method = req.method.toUpperCase();

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
                new URL(req.url()).pathname
            );
            if (!pathParams) {
                continue;
            }
            handler(req, res, pathParams);
            return;
        }

        sendJsonResponse(res, 404, {
            errorCode: ErrorCodes.ROUTE_NOT_FOUND,
            errorMessage: `Route ${req.url()} not found`,
        });
    }

    matchRoute(route, url) {
        const splitRoute = route.split('/');
        const splitUrl = url.split('/');

        if (splitUrl.length !== splitUrl.length) {
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
