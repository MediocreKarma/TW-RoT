import {getAllSignCategoriesService, getSignCategoryService} from "./signServices.js";
import {sendJsonResponse} from "../../common/response.js";

export async function getAllSignCategories(req, res) {
    const serviceResponse = await getAllSignCategoriesService();
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}

export async function getSignCategory(req, res, params) {
    const serviceResponse = await getSignCategoryService(params.id);
    sendJsonResponse(res, serviceResponse.status, serviceResponse.body, serviceResponse.message);
}