import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js"
import {
    addQuestionSolution,
    createQuestionnaire,
    getQuestionnaire,
    submitQuestionnaireSolution
} from "./service.js";

const app = new AppRouter();

app.post('/api/v1/users/:id/solutions', addQuestionSolution);

app.get('/api/v1/users/:id/questionnaire', getQuestionnaire);
app.post('/api/v1/users/:id/questionnaire', createQuestionnaire);
app.post('/api/v1/questionnaires/:questionnaireId/question/:gqId/solution', submitQuestionnaireSolution);

app.listen(process.env.PORT);
