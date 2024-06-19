export function setCorsHeaders(response) {
    response.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    response.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS'); // Specify allowed methods
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Specify allowed headers
    response.setHeader('Access-Control-Allow-Credentials', true); // Allow credentials
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
