export const DEFAULT_SELECT_OPTION = {
    value: 'default',
    text: 'Selectează o categorie...',
};

export const NEW_CATEGORY_SELECT_OPTION = {
    value: 'new-category',
    text: 'Categorie nouă',
};

// export const EMPTY_BASE64_BUFFER = 'data:application/octet-stream;base64,';

export const validateFormData = (formData) => {
    console.log(formData);
    const validatorResponse = (isValid, errorMessage) => {
        return {
            valid: isValid,
            message: errorMessage,
        };
    };

    try {
        console.log(formData.categoryId);
        if (formData.categoryId === DEFAULT_SELECT_OPTION.value) {
            return validatorResponse(false, 'Nu a fost selectată o categorie');
        }
        if (
            formData.categoryId === NEW_CATEGORY_SELECT_OPTION.value &&
            !formData.categoryId
        ) {
            return validatorResponse(false, 'Categoria nouă nu poate fi goală');
        }

        if (formData.text.length === 0) {
            return validatorResponse(
                false,
                'Textul întrebării nu poate fi gol'
            );
        }

        if (formData.text.length > 4096) {
            return validatorResponse(false, 'Textul întrebării este prea lung');
        }

        const emptyCorrectAnswers = formData.answers.filter(
            (answer) =>
                answer.description.length === 0 && answer.correct === true
        );

        if (emptyCorrectAnswers.length > 0) {
            return validatorResponse(
                false,
                'Nu pot exista răspunsuri corecte cu descrierea goală'
            );
        }

        const answers = formData.answers.filter(
            (answer) => answer.description.length > 0
        );

        if (answers.length < 2) {
            return validatorResponse(
                false,
                'Trebuie ca întrebarea să aibă măcar 2 răspunsuri'
            );
        }

        const correctAnswers = answers.filter(
            (answer) => answer.correct === true
        );
        if (correctAnswers.length < 1) {
            return validatorResponse(
                false,
                'Trebuie ca întrebarea să aibă măcar 1 răspuns corect'
            );
        }
    } catch (e) {
        console.log(e);
        return validatorResponse(false, 'Date invalide');
    }

    return validatorResponse(true, '');
};

export const getBase64Buffer = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function (e) {
            const base64Image = e.target.result;
            resolve(base64Image);
        };
        reader.onerror = function (error) {
            reject(error);
        };
        reader.readAsDataURL(file);
    });
};

export const setImagePreview = (data) => {
    const preview = document.getElementById('image-preview');
    console.log(data?.slice(0, 100));
    if (data) {
        preview.src = data;
        preview.style.display = 'block';
    } else {
        preview.src = '';
        preview.style.display = 'none';
    }
};

export const setCategoryTitleInputVisibility = (show) => {
    const hiddenInput = document.getElementById('category-title-input');
    hiddenInput.style.display = show ? 'flex' : 'none';
};

export const showCategories = (categories = []) => {
    const select = document.getElementById('question-category');

    if (!select) {
        return;
    }

    select.innerHTML = '';

    const showOption = (value, text, selected = false) => {
        const option = document.createElement('option');

        option.value = value;
        option.innerText = text;

        if (selected) {
            option.selected = true;
        }

        select.appendChild(option);
    };

    showOption(DEFAULT_SELECT_OPTION.value, DEFAULT_SELECT_OPTION.text, true);

    categories.forEach((category) => {
        showOption(category.id, category.title);
    });

    showOption(
        NEW_CATEGORY_SELECT_OPTION.value,
        NEW_CATEGORY_SELECT_OPTION.text
    );

    select.addEventListener('change', () => {
        const value = select.value;
        if (value === NEW_CATEGORY_SELECT_OPTION.value) {
            setCategoryTitleInputVisibility(true);
        } else {
            setCategoryTitleInputVisibility(false);
        }
    });
};

export const addListenerToImageInput = () => {
    document
        .getElementById('image-upload')
        .addEventListener('change', async (event) => {
            const file = event.target.files[0];
            if (file) {
                const base64Image = await getBase64Buffer(file);
                setImagePreview(base64Image);
            }
        });
};

export const addListenerToImageResetInput = (defaultSrc) => {
    const imageUpload = document.getElementById('image-upload');
    const resetBtn = document.getElementById('image-reset');

    resetBtn.addEventListener('click', () => {
        // wipe image upload input
        imageUpload.value = '';

        // set image to default
        setImagePreview(defaultSrc);
    });
};

export const convertObjectToFormData = (objectData) => {
    let dataWithoutImage = { ...objectData };
    delete dataWithoutImage.image;

    const questionData = JSON.stringify(dataWithoutImage);
    let data = new FormData();
    data.append('question', questionData);
    if (objectData.image !== undefined) {
        data.append('image', objectData.image);
    }

    return data;
};

export const collectFormData = async (form) => {
    const data = new FormData(form);
    const dataObject = Object.fromEntries(data.entries());

    let finalDataObj = {};

    if (dataObject['image-upload'] && dataObject['image-upload'] != '') {
        finalDataObj.image = dataObject['image-upload'];
    }
    if (dataObject['category-id'] === NEW_CATEGORY_SELECT_OPTION.value) {
        finalDataObj.categoryTitle = dataObject['category-title'];
    } else if (dataObject['category-id'] === DEFAULT_SELECT_OPTION.value) {
        finalDataObj.categoryId = DEFAULT_SELECT_OPTION.value;
    } else {
        finalDataObj.categoryId = parseInt(dataObject['category-id'], 10);
    }

    finalDataObj.text = dataObject.description;
    finalDataObj.description = dataObject.description;

    let answers = [];

    for (let i = 1; i <= 3; ++i) {
        let answer = {};
        answer.description = dataObject[`answer${i}`];
        answer.correct = dataObject[`correct${i}`] !== undefined ? true : false;
        answers.push(answer);
    }

    finalDataObj.answers = answers.filter(
        (answer) => answer.correct !== false || answer.description.length !== 0
    );

    return finalDataObj;
};
