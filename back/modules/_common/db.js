import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'url';
import { ServiceResponse } from './serviceResponse.js';
import { ErrorCodes } from '../../common/constants.js';

const { Pool } = pg;
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '/.env') });

/**
 * basic pool object used throughout the application
 * in order to connect to the postgresql database.
 */
export const pool = new Pool({
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE,
    schema: process.env.DATABASE_SCHEMA,
});

/**
 * Wrapper around any function that allocates a client
 * and also releases it after execution
 * 
 * The first parameter of the handler must be the client object
 * 
 * @param {*} handler the wraped function
 * @returns a new function that doesn't need the first `client` parameter
 */
export function withDatabaseOperation(handler) {
    return async function () {
        const client = await pool.connect();
        try {
            const result = await handler(client, ...arguments);
            return result;
        } catch (error) {
            console.error(error);
            return new ServiceResponse(500, {errorCode: ErrorCodes.SERVER_ERROR}, 'Internal Server Error');
        } finally {
            client.release();
        }
    };
}

const responseHandler = async (client, result) => {
    if (result instanceof ServiceResponse) {
        if (200 <= result.status && result.status <= 299) {
            await client.query('COMMIT');
        }
        else {
            await client.query('ROLLBACK');
        }
    }
    else {
        await client.query('COMMIT');
    }
}

/**
 * Wrapper that begins and commits, or rollbacks, a transaction
 * over a given client and handler. The first parameter of the handler
 * must be the client
 * 
 * @param {*} client the active client
 * @param {*} handler the handler function
 * @returns a function that takes the same parameters as the handler
 */
export function wrapOperationWithTransaction(client, handler) {
    return async function () {
        try {
            await client.query('BEGIN');
            const result = await handler(client, ...arguments);
            responseHandler(client, result);
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            return new ServiceResponse(500, {errorCode: ErrorCodes.SERVER_ERROR}, 'Internal Server Error');
        }
    };
}

/**
 * Wrapper around any function that allocates a client
 * and begins a transaction, that it also manages
 * 
 * The first parameter of the handler must be the client object
 * 
 * @param {*} handler the wraped function
 * @returns a new function that doesn't need the first `client` parameter
 */
export function withDatabaseTransaction(handler) {
    return async function () {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            const result = await handler(client, ...arguments);
            responseHandler(client, result);
            return result;
        } catch (error) {
            await client.query('ROLLBACK');
            console.error(error);
            return new ServiceResponse(500, {errorCode: ErrorCodes.SERVER_ERROR}, 'Internal Server Error');
        } finally {
            client.release();
        }
    };
}
