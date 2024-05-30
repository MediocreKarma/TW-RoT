import pg from 'pg';
import dotenv from 'dotenv';

const {Pool} = pg;
dotenv.config({ path: '.env' });

export const pool = new Pool({
    user: process.env.DATABASE_USERNAME,
    password: process.env.DATABASE_PASSWORD,
    host: process.env.DATABASE_HOST,
    port: process.env.DATABASE_PORT,
    database: process.env.DATABASE,
    schema: process.env.DATABASE_SCHEMA,
});

const client = await pool.connect();

await client.query('select 1'); // will error if client is invalid