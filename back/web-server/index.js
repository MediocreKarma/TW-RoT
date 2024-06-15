import { WebServer } from "./webServer.js";

const server = new WebServer();

server.addWildcardRoute('/*', '../../front');

server.listen(12734, 'localhost');