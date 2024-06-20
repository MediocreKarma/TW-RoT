import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter, Authentication} from "../_common/appRouter.js";
import {
    getAllExerciseCategories,
    getIncorrectlySolvedQuestion, getSolution,
    getUnsolvedQuestionByCategory
} from "./service.js";
import { 
    addQuestionSolution, 
    createQuestionnaire, 
    finishQuestionnaire, 
    getQuestionnaire, 
    submitQuestionnaireSolution 
} from './questionnaire.js';
import {getImage} from '../_common/getLocalImage.js'

const app = new AppRouter(Authentication.REQUIRE);

app.get('/api/v1/images/:name', getImage);

app.get('/api/v1/exercises/categories', getAllExerciseCategories);
app.get('/api/v1/exercises/unsolved/:id', getUnsolvedQuestionByCategory);
app.get('/api/v1/exercises/incorrectly-solved', getIncorrectlySolvedQuestion);
app.get('/api/v1/exercises/:id/solution', getSolution);

app.post('/api/v1/users/:id/submissions', addQuestionSolution);

app.get('/api/v1/users/:id/questionnaire', getQuestionnaire);
app.post('/api/v1/users/:id/questionnaire', createQuestionnaire);
app.post('/api/v1/users/:id/questionnaire/questions/:qId/solution', submitQuestionnaireSolution);
app.put('/api/v1/users/:id/questionnaire/submitted', finishQuestionnaire);

app.listen(process.env.EXERCISES_PORT);
