import dotenv from 'dotenv';

dotenv.config({path: '.env'});

import {AppRouter} from "./appRouter.js";
import {getAllChapters, getChapterContent} from "./controllers/chapterController.js";
import {getAllSignCategories, getSignCategory} from "./controllers/signController.js";
import {
    getAllExerciseCategories,
    getIncorrectlySolvedQuestion, getSolution,
    getUnsolvedQuestionByCategory
} from "./controllers/exerciseController.js";
import {addQuestionSolution, createQuestionnaire} from "./controllers/userController.js";
import {login, register} from "./controllers/authController.js";

const app = new AppRouter();

app.get('/api/v1/chapters', getAllChapters);
app.get('/api/v1/chapters/:id', getChapterContent);

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);

app.get('/api/v1/exercises/categories', getAllExerciseCategories);
app.get('/api/v1/exercises/unsolved/:id', getUnsolvedQuestionByCategory);
app.get('/api/v1/exercises/incorrectly-solved', getIncorrectlySolvedQuestion);
app.get('/api/v1/exercises/:id/solution', getSolution);

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/users/:id/solutions', addQuestionSolution);
app.post('/api/v1/users/:id/questionnaire', createQuestionnaire);

app.listen(process.env.PORT);
