import {withDatabaseOperation} from "../_common/db.js";
import {ServiceResponse} from "../_common/serviceResponse.js";
import { ErrorCodes } from "../../common/constants.js";
import pkg from 'bcryptjs';
const {genSalt, hash, compare} = pkg;
import { nanoid } from "nanoid";
import { createTransport } from "nodemailer";
import { readFileSync } from "fs";
import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

const CONFIRM_EMAIL_SUBJECT = 'Confirmare de Înregistrare pe ProRutier';

const emailTransporter = createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD
    }
});

const genToken = () => {
    return nanoid(64);
}

const validate = (field, fieldName, minLength, maxLength) => {
    const capitalizedFieldName = fieldName.toUpperCase();
    if (!field) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_IN_BODY`]}, `${fieldName} not in body`);
    }    
    if (field.length < minLength) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_TOO_SHORT`]}, `${fieldName} too short`);
    }
    if (field.length > maxLength) {
        return new ServiceResponse(400, {errorCode: ErrorCodes[`${capitalizedFieldName}_TOO_LONG`]}, `${fieldName} too long`);
    }
    return null;
}

const registerAccount = withDatabaseOperation(async (client, username, email, password) => {
    try {
        const exists = (await client.query(
            `select count(' ') as exists from user_account 
                where email = $1::varchar or new_email = $1::varchar`,
            [email]
        )).rows[0]['exists'];
        if (parseInt(exists) !== 0) {
            return;
        }
        const hashedPass = await hash(password, await genSalt());

        const id = (await client.query(
            `insert into user_account (username, new_email, hash)
                values ($1::varchar, $2::varchar, $3::varchar)
                returning id`,
            [username, email, hashedPass]
        )).rows[0]['id'];

        const token = genToken();
        await client.query(
            `insert into user_token (user_id, token_type, token_value, created_at)
                values($1::int, 'confirm_email', $2::varchar, now()::timestamp)`,
            [id, token]
        );
        const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
        let template = readFileSync('templates/confirmationEmail.html', 'utf-8');
        template = template
            .replace(/{USERNAME}/g, username)
            .replace(/{CONFIRMATION_LINK}/g, link)
            .replace(/{WEBSITE_NAME}/g, process.env.WEBSITE_NAME);
        await emailTransporter.sendMail({
            from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
            to: email,
            subject: CONFIRM_EMAIL_SUBJECT,
            html: template
        });
    }
    catch(e) {
        console.log(e);
    } // mute error
});

export const register = withDatabaseOperation(async function (
   client, _req, _res, params
) {
    const username = params['body']['username'];
    const usernameValidationStatus = validate(username, 'username', 6, 64);
    if (usernameValidationStatus) {
        return usernameValidationStatus;
    }
    if (!/[A-Za-z0-9_\.]+/.test(username)) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.USERNAME_INVALID_CHARS}, 'Username contains illegal characters');
    }
    const password = params['body']['password'];
    const passwordValidationStatus = validate(password, 'password', 8, 64);
    if (passwordValidationStatus) {
        return passwordValidationStatus;
    }
    const email = params['body']['email'];
    const emailValidationStatus = validate(email, 'email', 0, 256);
    if (emailValidationStatus) {
        emailValidationStatus.body.errorCode = BAD_EMAIL;
        return emailValidationStatus;
    }
    if (!email.includes('@')) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.BAD_EMAIL}, 'Email is not valid');
    }
    const rows = (await client.query(
        `select count(' ') as exists from user_account where username = $1::varchar`,
        [username]
    )).rows;

    if (rows[0]['exists'] === 1) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.USERNAME_ALREADY_EXISTS}, 'Username is taken');
    }
    registerAccount(username, email, password); // launch async task after validations

    return new ServiceResponse(200, null, 'Account successfully registered');
});

// TODO: Authentication token
export const login = withDatabaseOperation(async function (
    client, _req, res, params
) {
    const password = params['body']['password'];
    const passwordValidationStatus = validate(password);
    if (passwordValidationStatus) {
        return passwordValidationStatus;
    }
    const identifier = params['body']['identifier'];
    idType = identifier.includes('@') ? 'email' : 'username';
    const userAccount = (await client.query(
        `select id, username, updated_at as updatedAt, roles, hash from user_account where ${idType} = $1::varchar`,
        [identifier],
    )).rows;
    
    if (userAccount.length === 0 || !(await compare(password, userAccount[0]['hash']))) {
        return new ServiceResponse(400, null, 'Invalid credentials');
    }
    delete userAccount[0]['hash'];
    await client.query(
        `delete from user_token where user_id = $1::int`,
        [userAccount[0]['id']]
    );
    const token = genToken();
    await client.query(
        `insert into user_token (user_id, token_type, token_value, created_at)
            values($1::int, 'session', $2::varchar, now()::timestamp)`,
        [userAccount[0]['id'], token]
    );
    const cookie = `TW-RoT-Auth-Cookie=${token}; Max-Age=${60 * 60 * 24 * 30}; SameSite=Strict; HttpOnly; Secure`;
    res.setHeader('Set-Cookie', cookie);
    return new ServiceResponse(200, {user: userAccount[0]}, 'Account successfully logged in');
});

export const validateToken = withDatabaseOperation(async function (
    client, _req, _res, params
) {

});