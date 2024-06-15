import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import {getAllSignCategories, getSignCategory} from "../traffic-signs/signController.js";

const app = new AppRouter();

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);

app.listen(process.env.TRAFFIC_SIGNS_PORT);
