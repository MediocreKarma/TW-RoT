import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import {getAllChapters, getChapterContent} from "./service.js";

const app = new AppRouter('RoT Chapters', process.env.CHAPTERS_PORT);

app.get('/api/v1/chapters', getAllChapters);
app.get('/api/v1/chapters/:id', getChapterContent);

app.start();
