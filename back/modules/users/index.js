import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter, Authentication} from "../_common/appRouter.js"

const app = new AppRouter(Authentication.REQUIRE);

app.listen(process.env.USERS_PORT);
