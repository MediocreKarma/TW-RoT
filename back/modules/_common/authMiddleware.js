import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';
dotenv.config({path: '../../.env'});

const url = new URL(process.env.AUTH_URL);

const getCWD = () => {
    return dirname(fileURLToPath(import.meta.url));
};

const ROOT_CA = readFileSync(getCWD() + '/../../common/rootCA.pem');

export async function getAuth(req) {
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
        const proxyReq = protocol.request(options, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve(JSON.parse(data ?? {}));
            });
        });
        proxyReq.on('error', (_err) => {
            resolve({});
        });
        proxyReq.end();
    });
}