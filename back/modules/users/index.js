import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter, Authentication} from "../_common/appRouter.js"
import { deleteUser, getLeaderboard, getUsers } from './service.js';

const app = new AppRouter(Authentication.REQUIRE);

app.delete('/api/v1/users/:id', deleteUser);
app.get('/api/v1/leaderboard', getLeaderboard);
app.get('/api/v1/users', getUsers);

app.listen(process.env.USERS_PORT);
