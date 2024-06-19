import API from '/js/api.js';
import { get } from '/js/requests.js';

export const fetchChapter = async (id) => {
    const response = await get(`${API.CHAPTERS}/chapters/${id}`);
    return await response.json();
};

export const fetchChapters = async () => {
    const response = await get(`${API.CHAPTERS}/chapters`);
    return await response.json();
};
