import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import { Authentication } from '../_common/appRouter.js';
import {deleteChapter, getAllChapters, getChapterContent, patchChapter, postChapter} from "./service.js";

const app = new AppRouter('RoT Chapters', process.env.CHAPTERS_PORT, Authentication.REQUIRE);

app.get('/api/v1/chapters', getAllChapters);
app.post('/api/v1/chapters', postChapter);
app.get('/api/v1/chapters/:id', getChapterContent);
app.patch('/api/v1/chapters/:id', patchChapter);
app.delete('/api/v1/chapters/:id', deleteChapter);

app.start();
