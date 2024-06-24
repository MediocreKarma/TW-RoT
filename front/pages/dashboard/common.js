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

export const getPaginationRange = (total, count, currentPage) => {
    const totalPages = Math.ceil(total / count);
    if (totalPages === 0) {
        return [
            {
                value: 0,
                selected: true,
            },
        ];
    }

    let range = [];
    let rangeStart = Math.max(0, currentPage - 2);
    let rangeEnd = Math.min(totalPages - 1, currentPage + 2);
    if (rangeEnd - rangeStart < 4) {
        if (rangeStart > 0) {
            rangeStart = Math.max(0, rangeEnd - 4);
        }
        if (rangeEnd < totalPages - 1) {
            rangeEnd = Math.min(totalPages - 1, rangeStart + 4);
        }
    }
    for (let i = rangeStart; i <= rangeEnd; i++) {
        range.push({ value: i, selected: i === currentPage });
    }

    return range;
};

export const updatePagination = (page, total, count, setPage) => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const renderPaginationNode = (pageNo, selected, innerText) => {
        const btn = document.createElement('button');
        btn.onclick = async () => {
            btn.disabled = true;
            await setPage(pageNo);
        };
        btn.innerText = innerText ? innerText : pageNo + 1;
        btn.classList.add('button');
        if (selected) {
            btn.classList.add('selected');
            btn.disabled = true;
        }
        return btn;
    };

    paginationContainer.appendChild(renderPaginationNode(0, page === 0, '<<'));
    paginationContainer.appendChild(
        renderPaginationNode(
            Math.max(page - 1, 0),
            page === Math.max(page - 1, 0),
            '<'
        )
    );

    const numbers = getPaginationRange(total, count, page);
    numbers.forEach(({ value, selected }) => {
        paginationContainer.appendChild(renderPaginationNode(value, selected));
    });
    const lastPage = total < count ? 0 : Math.ceil(total / count) - 1;

    paginationContainer.appendChild(
        renderPaginationNode(
            Math.max(Math.min(page + 1, lastPage), 0),
            page === Math.max(Math.min(page + 1, lastPage), 0),
            '>'
        )
    );
    paginationContainer.appendChild(
        renderPaginationNode(lastPage, page === lastPage, '>>')
    );
};

export const setSearchDisabled = (disabled) => {
    const searchInput = document.getElementById('search');
    searchInput.disabled = disabled;
};

// reversible! function that disables search, for same reasons as above
export const disableSearch = () => {
    setSearchDisabled(true);
};

// function that enables search, because we're not rebuilding the search elements, they have to be re-enabled
export const enableSearch = () => {
    setSearchDisabled(false);
};

export function scrollToTop() {
    document.documentElement.scrollTo({
        top: 0,
        behavior: 'smooth',
    });
}

// irreversible function that disables pagination buttons (to prevent race conditions while loading data)
export const disablePagination = () => {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.querySelectorAll('button').forEach((button) => {
        button.disabled = true;
    });
};
