export const updateUrlParameter = (name, value) => {
    let url = new URL(window.location.href);
    if (value) {
        url.searchParams.set(name, value);
    } else {
        url.searchParams.delete(name);
    }
    window.history.pushState({}, '', url);
};

export const getUrlParameter = (name) => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get(name);
};
