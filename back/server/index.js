require('dotenv').config();
const pg = require('pg');
const { RestServer, Methods } = require('./restServer');

const server = new RestServer();

server.registerRoute(Methods.GET, '/api/v1/capitole');

server.listen(process.env.PORT);
