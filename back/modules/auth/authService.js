import {withDatabaseOperation} from "../_common/db.js";
import {ServiceResponse} from "../_common/models/serviceResponse.js";

export const registerService = withDatabaseOperation(async function (
   client, params
) {
    try {
        await client.query(
            'insert into user_account (username, email, hash, salt) ' +
                'values ($1::varchar, $2::varchar, $3::varchar, $4::varchar)',
            [params['username'], params['email'], params['password'], '']
        );
    } catch (e) {
        if (e.code === '23505') { // unique violation

            if (e.detail.includes('Key (username)')) {
                return new ServiceResponse(400, null, 'Username is taken');
            }
            if (!e.detail.includes('Key (email)')) {
                throw e;
            }
        }
    }

    return new ServiceResponse(200, null, 'Account successfully registered');
});

export const loginService = withDatabaseOperation(async function (
    client, params
) {
    const response = (await client.query(
        'select id, hash from user_account where email = $1::varchar',
        [params['email']],
    )).rows;

    if (response.length === 0 || response[0]['hash'] !== params['password']) {
        return new ServiceResponse(400, null, 'Invalid credentials');
    }

    return new ServiceResponse(200, {id: response[0]['id']}, 'Account successfully logged in');
});