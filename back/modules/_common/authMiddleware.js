import http from 'http';
import https from 'https';
import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

const url = new URL(process.env.AUTH_URL);

export async function getAuth(req) {
    return new Promise((resolve, _reject) => {
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: '/api/v1/auth/authenticated',
            method: 'POST',
            headers: { ...req.headers, 'Content-Length': 0 }
        };
        const protocol = url.protocol === 'https' ? https : http;
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