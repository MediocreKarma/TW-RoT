import fs from 'fs';

/**
 * Sets all CORS-related headers to adequate values
 * 
 * @param {*} response the response entity 
 * @returns response
 */
export function setCorsHeaders(response) {
    response.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL);
    response.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, POST, PUT, DELETE, OPTIONS'); // Specify allowed methods
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); // Specify allowed headers
    response.setHeader('Access-Control-Allow-Credentials', 'true'); // Allow credentials
    response.setHeader('Access-Control-Max-Age', 60 * 60 * 24); // Cache the preflight request for 24 hours
    return response;
}

/**
 * Prepares transmission to send a js object in the body as JSON
 * 
 * @param {*} response the response entity
 * @param {*} status the status of the response (100-599)
 * @param {*} content the object to be put in the response
 * @param {*} message optional message that will be added to the response
 */
export function sendJsonResponse(response, status, content, message = '') {
    setCorsHeaders(response);
    response.writeHead(status, message, {
        'Content-Type': 'application/json',
    });
    response.end(JSON.stringify(content, null, 2));
}

/**
 * Sends an empty response with CORS headers.
 * Used for OPTIONS request
 * 
 * @param {*} response the response entity
 * @param {*} status the status of the response (100-599)
 */
export function sendEmptyResponse(response, status) {
    setCorsHeaders(response);
    response.writeHead(status);
    response.end();
}

/**
 * Send a file response of a given content type
 * 
 * @param {*} response the response entity
 * @param {*} status the status of the response (100-599) 
 * @param {*} file the file object read in memory as a string
 * @param {*} contentType optional object content type as defined [here](https://www.iana.org/assignments/media-types/media-types.xhtml)
 * @param {*} message optional message that will be added to the response 
 */
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

function getContentType(req) {
    const extension = req.url.split('.').pop();
    switch (extension) {
        case 'css': return 'text/css';
        case 'js': return 'application/javascript';
        case 'json': return 'application/json';
        case 'yml': return 'application/x-yaml';
        case 'html': return 'text/html';
        default: throw 'Unknown file extension'
    }
}

/**
 * Send a doc file if the req contains the folder swagger-ui
 * Used for app router
 * 
 * @param {*} req the request entity
 * @param {*} res the response entity
 * @returns boolean representing wether the file was served or not
 */
export function serveDocFile(req, res) {
    try {
        const contentType = getContentType(req);
        let filepath = req.url.substr(1);
        if (filepath.startsWith('_common')) {
            filepath = './../' + filepath;
        }
        if (!filepath.includes('swagger-ui')) {
            return false;
        }
        const file = fs.readFileSync(filepath, 'utf8');
        sendFileResponse(res, 200, file, contentType);
        return true;
    } catch (err) {
        console.log(err);
        return false;
    }
}