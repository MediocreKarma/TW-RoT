import API from '/js/api.js';
import { get, post, patch, del, postFormData } from '/js/authRequests.js';

export const fetchChapter = async (id) => {
    const response = await get(`${API.CHAPTERS}/chapters/${id}`);
    return await response.json();
};

export const fetchChapters = async (query = false) => {
    const response = await get(`${API.CHAPTERS}/chapters${query ? '?output=json' : ''}`);
    return await response.json();
};

export const deleteChapter = async (id) => {
    await del(`${API.CHAPTERS}/chapters/${id}`);
};

export const postChapter = async (data) => {
    await post(`${API.CHAPTERS}/chapters`, data);
};

export const postChapterForm = async (formData) => {
    await postFormData(`${API.CHAPTERS}/chapters`, formData);
}

export const patchChapter = async (id, data) => {
    await patch(`${API.CHAPTERS}/chapters/${id}`, data);
};

export const getChapter = async (id) => {
    const response = await get(`${API.CHAPTERS}/chapters/${id}`);
    return await response.json();
};

export const getChaptersCSV = () => {
    return `${API.CHAPTERS}/chapters?output=csv`;
};

export const getChapterCSV = (id) => {
    return `${API.CHAPTERS}/chapter/${id}?output=csv`;
};
