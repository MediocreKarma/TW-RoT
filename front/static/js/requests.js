function withFetch(fetchFunction) {
    return async function (...args) {
        try {
            const response = await fetchFunction(...args);

            if (!response.ok) {
                const errorData = await response.json();
                throw {
                    status: response.status,
                    statusText: response.statusText,
                    body: errorData,
                };
            }

            return response;
        } catch (error) {
            throw error;
        }
    };
}

const wrappedFetch = withFetch(fetch);

export const get = async (url, options = {}) => {
    return await wrappedFetch(url, {
        method: 'GET',
        ...options,
    });
};

export const post = async (url, data, options = {}) => {
    return await wrappedFetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
    });
};

export const put = async (url, data, options = {}) => {
    return await wrappedFetch(url, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
    });
};

export const del = async (url, options = {}) => {
    return await wrappedFetch(url, {
        method: 'DELETE',
        ...options,
    });
};
