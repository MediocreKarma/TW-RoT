import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter, Authentication} from "../_common/appRouter.js";
import {
    getAllExerciseCategories,
    getIncorrectlySolvedQuestion, getSolution,
    getUnsolvedQuestion,
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
import { addQuestion, deleteQuestion, fetchQuestion, fetchQuestions, updateQuestion } from './adminControls.js';

const app = new AppRouter('RoT Exercises', process.env.EXERCISES_PORT, Authentication.REQUIRE);

app.get('/api/v1/images/:name', getImage);

app.get('/api/v1/exercises/categories', getAllExerciseCategories);
app.get('/api/v1/exercises/unsolved/random', getUnsolvedQuestion);
app.get('/api/v1/exercises/categories/:id/unsolved/random', getUnsolvedQuestionByCategory);
app.get('/api/v1/exercises/incorrectly-solved/random', getIncorrectlySolvedQuestion);
app.get('/api/v1/exercises/:id/solution', getSolution);

app.post('/api/v1/users/:id/submissions', addQuestionSolution);

app.get('/api/v1/users/:id/questionnaire', getQuestionnaire);
app.post('/api/v1/users/:id/questionnaire', createQuestionnaire);
app.post('/api/v1/users/:id/questionnaire/questions/:qId/solution', submitQuestionnaireSolution);
app.put('/api/v1/users/:id/questionnaire/submitted', finishQuestionnaire);

app.get('/api/v1/exercises', fetchQuestions);
app.get('/api/v1/exercises/:id', fetchQuestion);
app.post('/api/v1/exercises', addQuestion);
app.put('/api/v1/exercises/:id', updateQuestion);
app.delete('/api/v1/exercises/:id', deleteQuestion);

app.start();
