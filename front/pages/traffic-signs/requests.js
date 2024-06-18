import API from '/js/api.js';

// TODO: wrapper over any fetch function to throw error if bad request

export const fetchCategories = async () => {
    const response = await fetch(`${API.TRAFFIC_SIGNS}/sign-categories`);
    const data = await response.json();
    return data;
};

export const fetchCategory = async (id) => {
    const response = await fetch(`${API.TRAFFIC_SIGNS}/sign-categories/${id}`);
    const data = await response.json();
    return data;
};
