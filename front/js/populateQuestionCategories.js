const API_URL = 'http://localhost:12734/api/v1';

const showLoading = (domNode) => {
    domNode.innerText = 'Se încarcă...';
};

const fetchCategories = async () => {
    // get token from local storage if there

    let headers = {};
    if (localStorage.getItem('token') !== null) {
        headers = {
            Authorization: 'Bearer ' + localStorage.getItem('token'),
        };
    }

    const response = await fetch(`${API_URL}/exercises/categories`, {
        headers: headers,
    });

    if (!response.ok) {
        console.log(response);
    }

    const data = await response.json();
    return data;
};

const renderCategory = (categoryData) => {
    const anchor = document.createElement('a');
    anchor.href = `./intrebare.html?type=unsolved&category=${categoryData.id}`;

    const percentage =
        (categoryData['solved_questions'] / categoryData['total_questions']) *
        100;

    const cardDiv = document.createElement('div');
    cardDiv.className = 'question-category';

    const fillerDiv = document.createElement('div');
    fillerDiv.className = 'question-category__filler';
    fillerDiv.style.width = percentage + '%';

    const titleParagraph = document.createElement('p');
    titleParagraph.className = 'question-category__title';
    titleParagraph.textContent = categoryData.title;

    const valueParagraph = document.createElement('p');
    valueParagraph.className = 'question-category__value';
    valueParagraph.textContent = `${categoryData['solved_questions']}/${categoryData['total_questions']}`;

    cardDiv.appendChild(fillerDiv);
    cardDiv.appendChild(titleParagraph);
    cardDiv.appendChild(valueParagraph);

    anchor.appendChild(cardDiv);

    return anchor;
};

const renderCategories = async () => {
    const container = document.getElementById('categories');
    showLoading(container);

    const categoriesData = await fetchCategories();
    console.log(categoriesData);
    container.innerHTML = '';

    categoriesData.categories.forEach((category) => {
        container.appendChild(renderCategory(category));
    });
};

window.addEventListener('load', renderCategories);
