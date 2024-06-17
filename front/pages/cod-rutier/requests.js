import API from '/js/api.js';

// TODO: wrapper over any fetch function to throw error if bad request

export const fetchChapter = async (id) => {
    const response = await fetch(`${API.CHAPTERS}/chapters/${id}`);
    const data = await response.json();
    return data;
};

export const fetchChapters = async () => {
    const response = await fetch(`${API.CHAPTERS}/chapters`);
    const data = await response.json();
    return data;
};
