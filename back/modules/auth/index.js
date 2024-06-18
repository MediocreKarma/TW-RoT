import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import { login, register, requestCredentialChange, verify } from './service.js';

const app = new AppRouter();

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);
app.post('/api/v1/auth/verify', verify);
app.post('/api/v1/auth/change-credentials', requestCredentialChange)

app.listen(process.env.AUTH_PORT);
