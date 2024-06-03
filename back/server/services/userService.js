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

    console.log(params);

    [...answers].sort((a, b) => a['answerId'] - b['answerId']);

    let bitset = 0;
    for (const answer of answers) {
        bitset = bitset * 2 + (answer['selected'] ? 1  : 0);
    }

    await client.query(
        'select * from register_answer($1::int, $2::int, $3::int)',
        [userId, questionId, bitset],
    );

    return new ServiceResponse(200, null, 'Successfully registered answer');
})

await addQuestionSolutionService({
    authorization: 1, id: 1, questionId: 1,
    answers: [{}]
})