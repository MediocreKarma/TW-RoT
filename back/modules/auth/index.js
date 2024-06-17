import dotenv from 'dotenv';
dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import { login, register } from './service.js';

const app = new AppRouter();

app.post('/api/v1/auth/register', register);
app.post('/api/v1/auth/login', login);

app.listen(process.env.AUTH_PORT);
