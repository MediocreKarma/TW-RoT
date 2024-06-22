import dotenv from 'dotenv';

dotenv.config({path: '../../.env'});

import {AppRouter} from "../_common/appRouter.js";
import {getAllSignCategories, getComparison, getComparisonCategories, getComparisonCategory, getSignCategory}  from "./service.js";
import {getImage} from '../_common/getLocalImage.js'

const app = new AppRouter('RoT Traffic Signs', process.env.TRAFFIC_SIGNS_PORT);

app.get('/api/v1/sign-categories', getAllSignCategories);
app.get('/api/v1/sign-categories/:id', getSignCategory);
app.get('/api/v1/images/:name', getImage);
app.get('/api/v1/comparison-categories', getComparisonCategories);
app.get('/api/v1/comparison-categories/:ccId/comparisons', getComparisonCategory);
app.get('/api/v1/comparison-categories/:ccId/comparisons/:cId', getComparison);

app.start();
