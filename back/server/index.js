import dotenv from 'dotenv';

dotenv.config({path: '.env'});

import {RestServer, Methods} from "./restServer.js";
import {getAllChapters} from "./controllers/chapterController.js";

const server = new RestServer();

server.registerRoute(Methods.GET, '/api/v1/chapters', getAllChapters);

server.listen(process.env.PORT);
