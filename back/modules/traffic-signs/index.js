import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import {getAllSignCategories, getComparison, getComparisonCategories, getComparisonCategory, getSignCategory, getSignImage}  from "./service.js";

const app = new AppRouter();

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);
app.get('/api/v1/images/:name', getSignImage);
app.get('/api/v1/comparison-categories', getComparisonCategories);
app.get('/api/v1/comparison-categories/:ccId/comparisons', getComparisonCategory);
app.get('/api/v1/comparison-categories/:ccId/comparisons/:cId', getComparison);

app.listen(process.env.TRAFFIC_SIGNS_PORT);
