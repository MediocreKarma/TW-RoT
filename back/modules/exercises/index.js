import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import {
    getAllExerciseCategories,
    getIncorrectlySolvedQuestion, getSolution,
    getUnsolvedQuestionByCategory
} from "./service.js";

const app = new AppRouter();

app.get('/api/v1/exercises/categories', getAllExerciseCategories);
app.get('/api/v1/exercises/unsolved/:id', getUnsolvedQuestionByCategory);
app.get('/api/v1/exercises/incorrectly-solved', getIncorrectlySolvedQuestion);
app.get('/api/v1/exercises/:id/solution', getSolution);

app.listen(process.env.EXERCISES_PORT);
