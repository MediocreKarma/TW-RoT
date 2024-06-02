import dotenv from 'dotenv';

dotenv.config({path: '.env'});

import {AppRouter, Methods} from "./appRouter.js";
import {getAllChapters, getChapterContent} from "./controllers/chapterController.js";
import {getAllSignCategories, getSignCategory} from "./controllers/signController.js";
import {getAllExerciseCategories} from "./controllers/exerciseController.js";

const app = new AppRouter();

app.get('/api/v1/chapters', getAllChapters);
app.get('/api/v1/chapters/:id', getChapterContent);

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);

app.get('/api/v1/exercise-categories', getAllExerciseCategories);

app.listen(process.env.PORT);
