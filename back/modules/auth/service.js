import {withDatabaseOperation, withDatabaseTransaction, wrapOperationWithTransaction} from "../_common/db.js";
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

const genToken = withDatabaseOperation(async (client) => {
    while (true) { // collision are really unlikely, but still possible
        const token = nanoid(64);
        const exists = (await client.query(
            `select count(' ') as exists from user_token where token_value = $1::varchar`,
            [token]
        )).rows[0]['exists'];
        if (Number.parseInt(exists) === 0) {
            return token;
        }
    }
});

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

        const token = await genToken();
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
    const msTimeout = 5000;
    const password = params['body']['password'];
    const passwordValidationStatus = validate(password);
    if (passwordValidationStatus) {
        return passwordValidationStatus;
    }
    const identifier = params['body']['identifier'];
    idType = identifier.includes('@') ? 'email' : 'username';
    const timerBegin = new Date().getTime();
    const userAccount = (await client.query(
        `select id, username, updated_at as updatedAt, roles, hash from user_account where ${idType} = $1::varchar`,
        [identifier],
    )).rows;
    
    if (userAccount.length === 0 || !(await compare(password, userAccount[0]['hash']))) {
        sleep(timerBegin + msTimeout - new Date().getTime());
        return new ServiceResponse(400, null, 'Invalid credentials');
    }
    delete userAccount[0]['hash'];
    try {
        const token = await genToken();

        await client.query(
            `insert into user_token (user_id, token_type, token_value, created_at)
                values($1::int, 'session', $2::varchar, now()::timestamp)`,
            [userAccount[0]['id'], token]
        );

        const cookie = `TW-RoT-Auth-Cookie=${token}; Max-Age=${60 * 60 * 24 * 30}; SameSite=Strict; HttpOnly; Secure`;
        res.setHeader('Set-Cookie', cookie);
    } catch (e) {
        sleep(timerBegin + msTimeout - new Date().getTime());
        throw e;
    }
    return new ServiceResponse(200, {user: userAccount[0]}, 'Account successfully logged in');
});

export const verify = withDatabaseOperation(async function(
    client, _req, _res, params
) {
    const token = params['body']['token'];
    if (!token) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.VERIFICATION_TOKEN_NOT_IN_BODY}, 'Verification token not in request body');
    }
    const result = (await client.query(
        `select id, user_id as "userId", created_at as "createdAt" from user_token where token_value = $1::varchar`,
        [token]
    )).rows;
    if (result.length === 0) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_VERIFICATION_TOKEN}, 'No such token exists');
    }
    const tokenInfo = result[0];
    if (tokenInfo['createdAt'].getTime() + 1000 * 60 * 60 < new Date().getTime()) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.EXPIRED_VERIFICATION_TOKEN}, 'Token is expired');
    }
    await wrapOperationWithTransaction(client, () => {
        client.query(
            `update user_account
                set email = new_email, new_email = null
                where id = $1::int`,
            [result[0]['userId']]
        );
        client.query(
            `delete from user_token where id = $1::int`,
            [result[0]['id']]
        );
    })();

    return new ServiceResponse(200, null, 'Sucessfully created account');
});

const handleRequestChange = withDatabaseOperation(async function(
    client, email, type
) {
    try {
        const result = (await client.query(
            `select id, username from user_account where email = $1::varchar`,
            [email]
        )).rows;
        if (result.length === 0) {
            return;
        }
        const userAccount = result[0];
        await client.query(
            `delete from user_token where user_id = $1::int and token_type not in ('email_confirmation', 'session')`,
            [userAccount['id']]
        );
        const token = await genToken();
        await client.query(
            `insert into user_token (user_id, token_type, token_value, created_at)
                values($1::int, $2::varchar, $3::varchar, now()::timestamp)`,
            [userAccount['id'], `change_${type}`, token]
        );
        const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
        const changeTypeString = (() => {
            if (type === 'email') {
                return 'email-ul';
            }
            if (type === 'username') {
                return 'numele de utilizator';
            }
            if (type === 'password') {
                return 'parola';
            }
            return null;
        })();
        if (!changeTypeString) {
            return;
        }
        const template = readFileSync('templates/changeRequest.html', 'utf-8')
            .replace(/{USERNAME}/g, userAccount['username'])
            .replace(/{LINK}/g, link)
            .replace(/{WEBSITE_NAME}/g, process.env.WEBSITE_NAME)
            .replace(/{CHANGE_TYPE}/g, changeTypeString);
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

export const requestCredentialChange = withDatabaseOperation(async function(
    _client, _req, _res, params
) {
    const email = params['body']['email'];
    const emailValidationStatus = validate(email, 'email', 0, 256);
    if (emailValidationStatus) {
        return emailValidationStatus;
    }
    const type  = params['body']['type'];
    if (!type) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.CHANGE_TYPE_NOT_IN_BODY}, 'Change type not in body');
    }
    if (!(['email', 'password', 'username'].includes(type))) {
        return new ServiceResponse(400, {errorCode: ErrorCodes.CHANGE_TYPE_INCORRECT}, 'Change type is invalid');
    }

    handleRequestChange(email, type);
    return new ServiceResponse(200, null, 'Successfully requested credential change');
});

export const verifyChangeRequestToken = withDatabaseOperation(async function (
    client, _req, _res, params
) {
    
});