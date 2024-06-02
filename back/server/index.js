import dotenv from 'dotenv';

dotenv.config({path: '.env'});

import {AppRouter, Methods} from "./appRouter.js";
import {getAllChapters, getChapterContent} from "./controllers/chapterController.js";
import {getAllSignCategories, getSignCategory} from "./controllers/signController.js";
import {
    getAllExerciseCategories,
    getIncorrectlySolvedQuestion, getSolution,
    getUnsolvedQuestionByCategory
} from "./controllers/exerciseController.js";
import {getUnsolvedQuestionService} from "./services/exerciseServices.js";

const app = new AppRouter();

app.get('/api/v1/chapters', getAllChapters);
app.get('/api/v1/chapters/:id', getChapterContent);

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);

app.get('/api/v1/exercises/categories', getAllExerciseCategories);
app.get('/api/v1/exercises/unsolved/:id', getUnsolvedQuestionByCategory);
app.get('/api/v1/exercises/incorrectly-solved', getIncorrectlySolvedQuestion);
app.get('/api/v1/exercises/:id/solution', getSolution);

app.post('/api/v1/users/:id/solutions', getAllExerciseCategories);

app.listen(process.env.PORT);
