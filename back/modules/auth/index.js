import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import { isAuthenticated, login, logout, register, requestCredentialChange, verify, verifyChangeRequest } from './service.js';

const app = new AppRouter();

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/auth/verify', verify);
app.post('/api/v1/auth/change-credentials', requestCredentialChange);
app.post('/api/v1/auth/change-password', verifyChangeRequest);
app.post('/api/v1/auth/change-email', verifyChangeRequest);
app.post('/api/v1/auth/change-username', verifyChangeRequest);
app.post('/api/v1/auth/authenticated', isAuthenticated);
app.post('/api/v1/auth/logout', logout);

app.listen(process.env.AUTH_PORT);