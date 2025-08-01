import {
    withDatabaseOperation,
    withDatabaseTransaction,
    wrapOperationWithTransaction,
} from '../_common/db.js';
import { ServiceResponse } from '../_common/serviceResponse.js';
import { ErrorCodes, USER_ROLES } from '../../common/constants.js';
import { isAdmin, isStringValidInteger, sleep } from '../../common/utils.js';
import pkg from 'bcryptjs';
const { genSalt, hash, compare } = pkg;
import { nanoid } from 'nanoid';
import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { parse } from 'node:url';
import dotenv from 'dotenv';
import { expireAuthCookie } from '../../common/authMiddleware.js';
dotenv.config({ path: '../../.env' });

const CONFIRM_EMAIL_SUBJECT = 'Confirmare de Înregistrare pe ProRutier';
const CHANGE_CREDENTIAL_SUBJECT =
    'Solicitare de schimbare a credențialelor pe ProRutier';
const CHANGE_EMAIL_SUBJECT = 'Confirmarea noului email de pe ProRutier';
const oneHourInMs = 60 * 60 * 1000;
const AUTH_COOKIE_NAME = process.env.AUTH_COOKIE_NAME;
const AUTH_COOKIE_PROPERTIES =
    `Max-Age=${60 * 60 * 24 * 30}; ` +
    'SameSite=None; HttpOnly; Secure; Path=/' +
    (process.env.DOMAIN === 'localhost'
        ? ''
        : `; Domain=${process.env.DOMAIN}`);

const validationProperties = Object.freeze({
    password: [8, 64],
    email: [3, 256],
    username: [6, 64],
});

const emailTransporter = createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
    },
});

const genToken = withDatabaseOperation(async (client) => {
    while (true) {
        // collision are really unlikely, but still possible
        const token = nanoid(64);
        const exists = (
            await client.query(
                `select count(' ') as exists from user_token where token_value = $1::varchar`,
                [token]
            )
        ).rows[0]['exists'];
        if (Number.parseInt(exists) === 0) {
            return token;
        }
    }
});

const validate = (field, fieldName) => {
    const capitalizedFieldName = fieldName.toUpperCase();
    if (!field) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes[`${capitalizedFieldName}_NOT_IN_BODY`] },
            `${fieldName} not in body`
        );
    }
    if (field.length < validationProperties[fieldName][0]) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes[`${capitalizedFieldName}_TOO_SHORT`] },
            `${fieldName} too short`
        );
    }
    if (field.length > validationProperties[fieldName][1]) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes[`${capitalizedFieldName}_TOO_LONG`] },
            `${fieldName} too long`
        );
    }
    return null;
};

const hashWithBcrypt = async (target) => {
    return await hash(target, await genSalt());
};

const isEmailUsed = async (client, email) => {
    const exists = (
        await client.query(
            `select count(' ') as exists from user_account 
                where email = $1::varchar or new_email = $1::varchar`,
            [email]
        )
    ).rows[0]['exists'];
    return parseInt(exists, 10) !== 0;
}

const registerAccount = withDatabaseTransaction(
    async (client, username, email, password) => {
        try {
            if (await isEmailUsed(client, email)) {
                return;
            }
            const hashedPass = await hashWithBcrypt(password);

            const id = (
                await client.query(
                    `insert into user_account (username, new_email, hash)
                        values ($1::varchar, $2::varchar, $3::varchar)
                        returning id`,
                    [username, email, hashedPass]
                )
            ).rows[0]['id'];

            const token = await genToken();
            await client.query(
                `insert into user_token (user_id, token_type, token_value, created_at)
                    values($1::int, 'confirm_email', $2::varchar, now()::timestamp)`,
                [id, token]
            );
            const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
            let template = readFileSync(
                'templates/confirmationEmail.html',
                'utf-8'
            );
            template = template
                .replace(/{USERNAME}/g, username)
                .replace(/{CONFIRMATION_LINK}/g, link)
                .replace(/{WEBSITE_NAME}/g, process.env.WEBSITE_NAME);
            await emailTransporter.sendMail({
                from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
                to: email,
                subject: CONFIRM_EMAIL_SUBJECT,
                html: template,
            });
        } catch (e) {
            client.query('ROLLBACK');
            console.log(e);
        } // mute error
    }
);

/**
 * Handler for account registration
 */
export const register = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    const username = params['body']?.username;
    const usernameValidationStatus = validate(username, 'username');
    if (usernameValidationStatus) {
        return usernameValidationStatus;
    }
    if (!/[A-Za-z0-9_\.]+/.test(username)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.USERNAME_INVALID_CHARS },
            'Username contains illegal characters'
        );
    }
    const password = params['body']?.password;
    const passwordValidationStatus = validate(password, 'password');
    if (passwordValidationStatus) {
        return passwordValidationStatus;
    }
    const email = params['body']?.email;
    const emailValidationStatus = validate(email, 'email');
    if (emailValidationStatus) {
        emailValidationStatus.body.errorCode = ErrorCodes.BAD_EMAIL;
        return emailValidationStatus;
    }
    if (!email.includes('@')) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.BAD_EMAIL },
            'Email is not valid'
        );
    }
    const rows = (
        await client.query(
            `select count(' ') as exists from user_account where username = $1::varchar`,
            [username]
        )
    ).rows;
    if (parseInt(rows[0]['exists'], 10) === 1) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.USERNAME_ALREADY_EXISTS },
            'Username is taken'
        );
    }
    registerAccount(username, email, password); // launch async task after validations

    return new ServiceResponse(204, null, 'Account successfully registered');
});

/**
 * Handler for account login
 */
export const login = withDatabaseOperation(async function (
    client,
    _req,
    res,
    params
) {
    const msTimeout = 5000;
    const password = params['body']?.password;
    const passwordValidationStatus = validate(password, 'password');
    if (passwordValidationStatus) {
        return passwordValidationStatus;
    }
    const identifier = params['body']?.identifier;
    const idType = identifier.includes('@') ? 'email' : 'username';
    const timerBegin = new Date().getTime();
    const userAccount = (
        await client.query(
            `select id, username, updated_at as "updatedAt", flags, hash from user_account where ${idType} = $1::varchar`,
            [identifier]
        )
    ).rows;

    if (
        userAccount.length === 0 ||
        !(await compare(password, userAccount[0]['hash']))
    ) {
        await sleep(timerBegin + msTimeout - new Date().getTime());
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_CREDENTIALS },
            'Invalid credentials'
        );
    }

    if ((userAccount[0].flags & USER_ROLES.BANNED) !== 0) {
        return new ServiceResponse(
            403, {errorCode: ErrorCodes.BANNED}, 'Banned'
        );
    }

    delete userAccount[0]['hash'];
    try {
        const token = await genToken();

        await client.query(
            `insert into user_token (user_id, token_type, token_value, created_at)
                values($1::int, 'session', $2::varchar, now()::timestamp)`,
            [userAccount[0]['id'], token]
        );

        const cookie = `${AUTH_COOKIE_NAME}=${token}; ${AUTH_COOKIE_PROPERTIES}`;
        res.setHeader('Set-Cookie', cookie);
    } catch (e) {
        await sleep(timerBegin + msTimeout - new Date().getTime());
        throw e;
    }
    return new ServiceResponse(
        200,
        { user: userAccount[0] },
        'Account successfully logged in'
    );
});

/**
 * Handler for account email verification
 */
export const verify = withDatabaseOperation(async function (
    client,
    _req,
    _res,
    params
) {
    const token = params['body']?.token;
    if (!token) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.VERIFICATION_TOKEN_NOT_IN_BODY },
            'Verification token not in request body'
        );
    }
    const result = (
        await client.query(
            `select id, user_id as "userId", created_at as "createdAt" from user_token where token_value = $1::varchar`,
            [token]
        )
    ).rows;
    if (result.length === 0) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.INVALID_VERIFICATION_TOKEN },
            'No such token exists'
        );
    }
    const tokenInfo = result[0];
    if (tokenInfo['createdAt'].getTime() + oneHourInMs < new Date().getTime()) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.EXPIRED_VERIFICATION_TOKEN },
            'Token is expired'
        );
    }
    await wrapOperationWithTransaction(client, () => {
        client.query(
            `update user_account
                set updated_at = now()::timestamp, email = new_email, new_email = null
                where id = $1::int`,
            [result[0]['userId']]
        );
        client.query(`delete from user_token where id = $1::int`, [
            result[0]['id'],
        ]);
    })();

    return new ServiceResponse(204, null, 'Sucessfully created account');
});

/**
 * Async task for handling account credential change requests without
 * being susceptible to timing attacks
 */
const handleRequestChange = withDatabaseOperation(async function (
    client,
    email,
    type
) {
    try {
        const result = (
            await client.query(
                `select id, username from user_account where email = $1::varchar`,
                [email]
            )
        ).rows;
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
        const link = `${process.env.FRONTEND_URL}/reset/${type}?token=${token}`;
        const changeTypeString = (() => {
            switch (type) {
                case 'email':
                    return 'email-ul';
                case 'username':
                    return 'numele de utilizator';
                case 'password':
                    return 'parola';
                default:
                    return null;
            }
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
            subject: CHANGE_CREDENTIAL_SUBJECT,
            html: template,
        });
    } catch (e) {
        console.log(e);
    } // mute error
});

/**
 * Handler for account requesting a credential change. Sends a confirmation email
 * via an async task
 */
export const requestCredentialChange = withDatabaseOperation(async function (
    client,
    req,
    _res,
    params
) {
    let email = params['body']?.email;
    if (!email) {
        const cookie = getAuthCookie(req);
        if (cookie instanceof ServiceResponse) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.NO_COOKIE_OR_EMAIL}, 'Missing cookie | email from request');
        }
        const emailResult = (await client.query(
            `select ua.email from user_account ua join user_token ut on ut.user_id = ua.id 
                where ut.token_type = 'session' and ut.token_value = $1::varchar`,
            [cookie]
        )).rows;
        if (emailResult.length === 0) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.UNAUTHENTICATED}, 'Invalid cookie');
        }
        email = emailResult[0]['email'];
    }
    const emailValidationStatus = validate(email, 'email');
    if (emailValidationStatus) {
        return emailValidationStatus;
    }
    const type = params['body']?.type;
    if (!type) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHANGE_TYPE_NOT_IN_BODY },
            'Change type not in body'
        );
    }
    if (!['email', 'password', 'username'].includes(type)) {
        return new ServiceResponse(
            400,
            { errorCode: ErrorCodes.CHANGE_TYPE_INCORRECT },
            'Change type is invalid'
        );
    }
    handleRequestChange(email, type);
    return new ServiceResponse(
        200,
        null,
        'Successfully requested credential change'
    );
});

/**
 * Perform an email update if possible
 */
const updateEmail = withDatabaseTransaction(async (client, userId, newEmail) => {
    try {
        if (await isEmailUsed(client, newEmail)) {
            return;
        }
    
        const username = (await client.query(
            `update user_account 
                set updated_at = now()::timestamp, new_email = $1::varchar
                where id = $2::int returning username`,
            [newEmail, userId]
        )).rows[0].username;
    
        const token = await genToken();
        await client.query(
            `insert into user_token (user_id, token_type, token_value, created_at)
                values($1::int, 'confirm_email', $2::varchar, now()::timestamp)`,
            [userId, token]
        );
        const link = `${process.env.FRONTEND_URL}/verify?token=${token}`;
        let template = readFileSync('templates/updateEmail.html', 'utf-8');
        template = template
            .replace(/{USERNAME}/g, username)
            .replace(/{CONFIRMATION_LINK}/g, link)
            .replace(/{WEBSITE_NAME}/g, process.env.WEBSITE_NAME);
        await emailTransporter.sendMail({
            from: `${process.env.EMAIL_NAME} <${process.env.EMAIL_ADDRESS}>`,
            to: newEmail,
            subject: CHANGE_EMAIL_SUBJECT,
            html: template,
        });
    }
    catch (err) {
        console.log(err);
    }
});

/**
 * Perform an username update
 */
const updateUsername = withDatabaseOperation(async (client, userId, newUsername) => {
    await client.query(
        `update user_account
            set updated_at = now()::timestamp, username = $1::varchar
            where id = $2::int`,
        [newUsername, userId]
    );
});

/**
 * Perform a password update
 */
const updatePassword = withDatabaseOperation(async (client, userId, newPassword) => {
    const hashedPass = await hashWithBcrypt(newPassword);
    await client.query(
        `update user_account
            set updated_at = now()::timestamp, hash = $1::varchar
            where id = $2::int`,
        [hashedPass, userId]
    );
});

/**
 * Verifies the validity of a credential change request
 */
export const verifyChangeRequest = withDatabaseTransaction(async function (
    client,
    req,
    res,
    params
) {
    const type = /\/change-([a-z]+)/.exec(parse(req.url, false).pathname)[1];
    if (!['email', 'password', 'username'].includes(type)) {
        return new ServiceResponse(
            500,
            { errorCode: ErrorCodes.SERVER_ERROR },
            'Invalid verification route'
        );
    }
    const changeValue = params['body']?.value;
    const validationStatus = validate(changeValue, type);
    if (validationStatus) {
        return validationStatus;
    }
    
    const user = (await isAuthenticated(req, res, params)).body.user;
    let userId;
    if (!(!user?.errorCode && (user?.flags & USER_ROLES.ADMIN) !== 0 && (user?.flags & USER_ROLES.BANNED) === 0)) {
        const token = params['body']?.token;
        if (!token) {
            return new ServiceResponse(
                400,
                { errorCode: ErrorCodes.CHANGE_REQUEST_TOKEN_NOT_IN_BODY },
                'Token missing in body'
            );
        }
        const result = (
            await client.query(
                `select ut.user_id as "userId", ut.created_at as "createdAt", ua.username as "username"
                from user_token ut join user_account ua 
                    on ua.id = ut.user_id 
                where token_value = $1::varchar and token_type = $2::varchar`,
                [token, `change_${type}`]
            )
        ).rows;
    
        if (result.length === 0) {
            return new ServiceResponse(
                400,
                { errorCode: ErrorCodes.INVALID_CHANGE_REQUEST_TOKEN },
                'No such change request token'
            );
        }

        const info = result[0];
        if (info['createdAt'].getTime() + oneHourInMs < new Date().getTime()) {
            return new ServiceResponse(
                403,
                { errorCode: ErrorCodes.EXPIRED_CHANGE_REQUEST_TOKEN },
                'Change request token has expired'
            );
        }
        userId = info['userId'];
    }
    else {
        userId = params['body']?.id;
        if (isNaN(userId)) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.INVALID_USER_ID}, 'Invalid user id');
        }

        const result = (await client.query(
            `select ' ' from user_account where id = $1::int and flags & ${USER_ROLES.ADMIN} = 0`,
            [userId]
        ));
        
        if (!result.rowCount) {
            return new ServiceResponse(404, {errorCode: ErrorCodes.USER_NOT_FOUND}, 'No such user');
        }

    }

    if (type === 'username') {
        const exists = parseInt((await client.query(
            `select count(' ') as exists from user_account where username = $1::varchar`,
            [changeValue]
        )).rows[0].exists, 10);

        if (exists) {
            return new ServiceResponse(400, {errorCode: ErrorCodes.USERNAME_ALREADY_EXISTS}, 'Username is already taken');
        }
    }

    await client.query(
        `delete from user_token where user_id = $1::int`, 
        [userId,]
    );

    switch (type) {
        case 'username':
            updateUsername(userId, changeValue);
            break;
        case 'password':
            updatePassword(userId, changeValue);
            break;
        case 'email':
            updateEmail(userId, changeValue);
            break;
    }
    return new ServiceResponse(204, null, 'Successfully changed credential');
});

/**
 * Utility function to extract the auth cookie
 * 
 * @param {*} req the request entity
 * @returns ServiceResponse on error, the token value on success
 */
const getAuthCookie = (req) => {
    const cookieHeader = req.headers?.cookie;
    if (!cookieHeader) {
        return new ServiceResponse(
            401,
            { errorCode: ErrorCodes.COOKIE_HEADER_NOT_FOUND },
            'No cookie header was found'
        );
    }
    const cookieParts = cookieHeader.split(';');
    const token = (() => {
        for (const cookie of cookieParts) {
            const parts = cookie.split('=');
            const key = parts[0].trim();
            if (key === AUTH_COOKIE_NAME) {
                return parts[1].trim();
            }
        }
        return null;
    })();
    if (!token) {
        return new ServiceResponse(
            401,
            { errorCode: ErrorCodes.AUTH_COOKIE_NOT_FOUND },
            'No auth cookie was found'
        );
    }
    return token;
};

/**
 * Handler to validate the authenticated status of a given requester,
 * by verifying the authentication cookie
 */
export const isAuthenticated = withDatabaseOperation(async function (
    client,
    req,
    res,
    _params
) {
    const cookieOutput = getAuthCookie(req);
    if (cookieOutput instanceof ServiceResponse) {
        return cookieOutput;
    }

    const result = (
        await client.query(
            `select id, username, updated_at as "updatedAt", flags,
                    solved_questionnaires as "solvedQuestionnaires",
                    total_questionnaires as "totalQuestionnaires",
                    solved_questions as "solvedQuestions",
                    total_questions as "totalQuestions"
                from validate_session($1::varchar)`,
            [cookieOutput]
        )
    ).rows;
    if (result.length === 0) {
        expireAuthCookie(res);
        return new ServiceResponse(
            401,
            { errorCode: ErrorCodes.AUTH_COOKIE_INVALID },
            'Auth cookie is invalid'
        );
    }
    if ((result[0].flags & USER_ROLES.BANNED) !== 0) {
        await client.query(
            `delete from user_token where user_id = $1::int`,
            [result[0].id]
        );
        return new ServiceResponse(403, { errorCode: ErrorCodes.BANNED }, 'User is banned');
    }

    return new ServiceResponse(200, { user: result[0] }, 'Token is valid');
});

/**
 * Function to remove the current authentication cookie
 * and destroy the active session
 */
export const logout = withDatabaseOperation(async function (
    client,
    req,
    res,
    _params
) {
    const cookieOutput = getAuthCookie(req);
    if (cookieOutput instanceof ServiceResponse) {
        return cookieOutput;
    }
    const result = await client.query(
        `delete from user_token where token_type = 'session' and token_value = $1::varchar`,
        [cookieOutput]
    );
    expireAuthCookie(res);
    if (result['rowCount'] === 0) {
        return new ServiceResponse(
            401,
            { errorCode: ErrorCodes.AUTH_COOKIE_INVALID },
            'Auth cookie is invalid'
        );
    }
    return new ServiceResponse(204, null, 'Successfully logged out');
});