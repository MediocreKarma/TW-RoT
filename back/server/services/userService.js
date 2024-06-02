import {withDatabaseOperation} from "../db.js";
import {sendJsonResponse} from "../response.js";
import {ServiceResponse} from "../models/serviceResponse.js";
import {getSolutionService} from "./exerciseServices.js";

export const addQuestionSolutionService = withDatabaseOperation(async function (
    client,
    params
){
    if (params['authorization'] === null) {
        return new ServiceResponse(401, null, 'Unauthenticated');
    }

    const userId = params['id'];
    if (userId !== params['authorization']) {
        return new ServiceResponse(403, null, 'Unauthorized');
    }

    const {questionId, answers} = params;

    const correctAnswers = (await getSolutionService(questionId)).body;
    const answerMapping = new Map(
        correctAnswers.map(answer => [answer['id'], answer['correct']])
    );

    const correct = answers.reduce(
        (acc, answer) => acc && answerMapping.get(answer['answerId']) === answer['selected'],
        true
    );

    // TODO: STOPPED HERE
    await client.query(
        ''
    )

})