import {withDatabaseOperation} from "../db.js";
import {ServiceResponse} from "../models/serviceResponse.js";

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