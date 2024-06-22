import fs from 'fs';

export function setCorsHeaders(response) {
    response.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    response.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, POST, PUT, DELETE, OPTIONS'); // Specify allowed methods
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Specify allowed headers
    response.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials
    response.setHeader('Access-Control-Max-Age', 60 * 60 * 24); // Cache the preflight request for 24 hours
    return response;
}

export function sendJsonResponse(response, status, content, message = '') {
    setCorsHeaders(response);
    response.writeHead(status, message, {
        'Content-Type': 'application/json',
    });
    response.end(JSON.stringify(content, null, 2));
}

export function sendEmptyResponse(response, status, message = '') {
    setCorsHeaders(response);
    response.writeHead(status);
    response.end();
}

export function sendFileResponse(response, status, file, contentType = '', message = '') {
    setCorsHeaders(response);
    if (contentType !== '') {
        response.writeHead(status, message, {
            'Content-Type': contentType,
        });
    }
    else {
        response.writeHead(status, message)
    }
    response.end(file);
}

function getDocFileAndContentType(req, res) {
    const extension = req.url.split('.').pop();
    let contentType = 'text/html';
    switch (extension) {
        case 'css': contentType = 'text/css'; break;
        case 'js': contentType = 'application/javascript'; break;
        case 'json': contentType = 'application/json'; break;
        case 'yml': contentType = 'application/x-yaml'; break;
        case 'html': contentType = 'text/html'; break;
        throw 'Unknown file extension'
    }
    
    return [req.url.substr(1), contentType];
}

export function serveDocFile(req, res) {
    try {
        let [filePath, contentType] = getDocFileAndContentType(req, res);
        if (filePath.startsWith('_common')) {
            filePath = './../' + filePath;
        }
        if (!filePath.includes('swagger-ui')) {
            return false;
        }
        const file = fs.readFileSync(filePath, 'utf8');
        sendFileResponse(res, 200, file, contentType);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}