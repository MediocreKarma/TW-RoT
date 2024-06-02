import pg from 'pg';
import dotenv from 'dotenv';
import {join, dirname} from "node:path";
import {fileURLToPath} from 'url'
import {ServiceResponse} from "./models/serviceResponse.js";

const {Pool} = pg;
dotenv.config({ path: join(dirname(fileURLToPath(import.meta.url)), '/.env') });

export const pool = new Pool({
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE,
    schema: process.env.DATABASE_SCHEMA,
});

export function withDatabaseOperation(handler) {
    return async function() {
        try {
            const client = await pool.connect();
            const result = await handler(client, ...arguments);
            client.release();
            return result;
        } catch (error) {
            console.error(error);
            return new ServiceResponse(500, null, 'Internal Server Error');
        }
    }
}