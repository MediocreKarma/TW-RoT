import API from '/js/api.js';
import { get } from '/js/authRequests.js';

export const fetchCategories = async () => {
    const response = await get(`${API.TRAFFIC_SIGNS}/sign-categories`);
    return await response.json();
};

export const fetchCategory = async (id) => {
    const response = await get(`${API.TRAFFIC_SIGNS}/sign-categories/${id}`);
    return await response.json();
};
