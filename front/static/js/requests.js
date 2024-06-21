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
        credentials: 'include',
        ...options,
    });
};

export const post = async (url, data, options = {}) => {
    return await wrappedFetch(url, {
        method: 'POST',
        credentials: 'include',
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
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        body: JSON.stringify(data),
        ...options,
    });
};

export const patch = async (url, data, options = {}) => {
    return await wrappedFetch(url, {
        method: 'PATCH',
        credentials: 'include',
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
        credentials: 'include',
        ...options,
    });
};
