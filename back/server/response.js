export function setCorsHeaders(response) {
    response.setHeader('Access-Control-Allow-Origin', '*');
    response.setHeader('Access-Control-Allow-Methods', '*');
    response.setHeader('Access-Control-Allow-Headers', '*');
    response.setHeader('Access-Control-Max-Age', 60 * 60 * 24);
    return response;
}

export function sendJsonResponse(response, status, content) {
    setCorsHeaders(response);
    response.writeHead(status, {
        'Content-Type': 'application/json',
    });
    response.end(content);
}

export function sendEmptyResponse(response, status) {
    setCorsHeaders(response);
    response.writeHead(status);
    response.end();
}
