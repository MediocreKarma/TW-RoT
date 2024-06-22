import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const getCWD = () => {
    return dirname(fileURLToPath(import.meta.url));
};

dotenv.config({path: getCWD() + '/../.env'});

const url = new URL(process.env.AUTH_URL);
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME;


const ROOT_CA = readFileSync(getCWD() + '/rootCA.pem');

/**
 * Expires the auth cookie of the requestr
 * 
 * @param {*} res the response entity 
 * @returns res
 */
export const expireAuthCookie = (res) => {
    res.setHeader(
        'Set-Cookie',
        `${AUTH_COOKIE_NAME}=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0; Path=/; HttpOnly; Secure; SameSite=None`
    );
    return res;
};
/**
 * 
 * 
 * @param {*} req the request entity
 * @param {*} res the response entity
 * @returns a promise that will resolve the call to the auth api 
 *  that validates the auth cookie
 */
export async function getAuth(req, res) {
    return new Promise((resolve, _reject) => {
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: '/api/v1/auth/authenticated',
            method: 'POST',
            headers: { ...req.headers, 'Content-Length': 0 },
            ca: ROOT_CA
        };
        const protocol = url.protocol.startsWith('https') ? https : http;
        const proxyReq = protocol.request(options, (proxyRes) => {
            let data = '';
            
            proxyRes.on('data', (chunk) => {
                data += chunk;
            });
            proxyRes.on('end', () => {
                if (proxyRes.statusCode >= 400 && proxyRes.statusCode <= 499) {
                    expireAuthCookie(res);
                }
                resolve(JSON.parse(data ?? {}));
            });
        });
        proxyReq.on('error', (_err) => {
            resolve({});
        });
        proxyReq.end();
    });
}