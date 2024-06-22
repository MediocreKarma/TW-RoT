import {Server} from 'https';
import {zip} from '../../common/utils.js';
import {parse} from "node:url";
import {sendEmptyResponse, sendJsonResponse, serveDocFile} from "../../common/response.js";
import {ErrorCodes} from "../../common/constants.js";
import { withResponse } from './serviceResponse.js';
import {getAuth} from '../../common/authMiddleware.js';
import { dirname } from 'node:path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { load, dump } from 'js-yaml';

export const Methods = Object.freeze({
    GET:    'GET',
    POST:   'POST',
    PUT:    'PUT',
    DELETE: 'DELETE',
    PATCH:  'PATCH',
});

export const Authentication = Object.freeze({
    REQUIRE: true, IGNORE: false
})

const getCWD = () => {
    return dirname(fileURLToPath(import.meta.url));
};

export class AppRouter extends Server {
    routes = new Map([
        [Methods.GET,    new Map()],
        [Methods.POST,   new Map()],
        [Methods.PUT,    new Map()],
        [Methods.DELETE, new Map()],
        [Methods.PATCH,  new Map()],
    ]);

    constructor(name, port, auth = Authentication.IGNORE) {
        super(
            {
                key: fs.readFileSync(getCWD() + '/../../common/localhost-key.pem'), 
                cert: fs.readFileSync(getCWD() + '/../../common/localhost.pem'), 
            }, 
            (req, res) => this.requestHandler(req, res)
        );
        this.port = port;
        this.middlewares = [];
        this.auth = auth;
        this.hasDocs = false;
        this.name = name;

        if (fs.existsSync('./swagger-ui')) {
            try {
                const openapiSpec = load(fs.readFileSync(`./swagger-ui/openapi.yml.template`, 'utf8'));
                const openapiSpecStr = dump(openapiSpec).replace(/{NAME}/g, name).replace(/{PORT}/g, port);
                fs.writeFileSync(`./swagger-ui/openapi.yml`, openapiSpecStr);
                fs.copyFileSync(`../_common/swagger-ui-templates/index.html`, `./swagger-ui/index.html`);
    
                const swaggerInitializerString = fs.readFileSync(`../_common/swagger-ui-templates/swagger-initializer.js.template`, 'utf-8')
                                                .replace(/{PORT}/g, port);
    
                fs.writeFileSync(`./swagger-ui/swagger-initializer.js`, swaggerInitializerString);
    
                console.log(`Built docs for ${name}`);
                this.hasDocs = true;
            }
            catch (err) {
                console.log(err);
            }
        }
    }

    registerMiddleware(handler) {
        this.middlewares.push(handler);
        return this;
    }

    get(route, handler) {
        return this.registerRoute(Methods.GET, route, handler);
    }

    patch(route, handler) {
        return this.registerRoute(Methods.PATCH, route, handler);
    }

    post(route, handler) {
        return this.registerRoute(Methods.POST, route, handler);
    }

    put(route, handler) {
        return this.registerRoute(Methods.PUT, route, handler);
    }

    delete(route, handler) {
        return this.registerRoute(Methods.DELETE, route, handler);
    }

    registerRoute(method, route, handler) {
        const routeMethods = this.routes.get(method);
        if (!routeMethods) {
            throw new Error(`Route ${method} not found`);
        }
        this.routes.get(method).set(route, withResponse(handler));
        return this;
    }

     async requestHandler(req, res) {
        const method = req.method.toUpperCase();
        const {pathname, query} = parse(req.url, true);
        let body = null;
        console.log(`Received request ${method} ${pathname}`);
        try {
            body = await this.getRequestBody(req);
        } catch (err) {
            sendJsonResponse(res, 400, {errorCode: ErrorCodes.INVALID_JSON_INPUT}, 'Could not parse body to json');
            return;
        }
        query && Object.keys(query).length !== 0 && console.log(`\t- query: ${JSON.stringify(query)}`);
        body  && Object.keys(body).length !== 0 && console.log(`\t- body: ${JSON.stringify(body)}`);

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
            const params = {
                query: query,
                body: body,
                path: pathParams,
                authorization: this.auth ? await getAuth(req, res) : {}
            };
            handler(req, res, params);
            return;
        }
        
        if (serveDocFile(req, res)) {
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

    getRequestBody(req) {
        return new Promise((resolve, reject) => {
            let body = '';
            req.on('data', (chunk) => {
                body += chunk.toString();
            });

            req.on('end', () => {
                let tmp;
                try {
                    tmp = JSON.parse(body || '{}');
                }
                catch (e) {
                    reject(e);
                }
                resolve(tmp);
            });
            req.on('error', (err) => {
                reject(err);
            });
        });
    }

    start() {
        console.log(`starting ${this.name} on ${this.port}`);
        super.listen(this.port);
    }
}
