import API from '/js/api.js';
import { get } from '/js/requests.js';

export const fetchComparisonCategories = async () => {
    const response = await get(`${API.TRAFFIC_SIGNS}/comparison-categories`);
    return await response.json();
};

export const fetchComparisonSignsInCategory = async (id) => {
    const response = await get(
        `${API.TRAFFIC_SIGNS}/comparison-categories/${id}/comparisons`
    );
    return await response.json();
};

export const fetchComparisonOfSignInCategory = async (categoryId, signId) => {
    const response = await get(
        `${API.TRAFFIC_SIGNS}/comparison-categories/${categoryId}/comparisons/${signId}`
    );
    return await response.json();
};
