export const DEFAULT_SELECT_OPTION = {
    value: 'default',
    text: 'Selectează o categorie...',
};

export const NEW_CATEGORY_SELECT_OPTION = {
    value: 'new-category',
    text: 'Categorie nouă',
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
    console.log('in data...');
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

export const collectFormData = async (form) => {
    const data = new FormData(form);
    const dataObject = Object.fromEntries(data.entries());
    console.log(dataObject);

    let finalDataObj = {};

    // TODO: this check does not work. what needs to be done: get image input, get .files.length to see if there are no file
    if (dataObject['image-upload']) {
        finalDataObj.image = await getBase64Buffer(dataObject['image-upload']);
    }
    if (dataObject['category-id'] === NEW_CATEGORY_SELECT_OPTION.value) {
        finalDataObj.categoryTitle = dataObject['category-title'];
    } else {
        finalDataObj.categoryId = dataObject['category-id'];
    }

    finalDataObj.answers = [];

    for (let i = 1; i <= 3; ++i) {
        let answer = {};
        answer.description = dataObject[`answer${i}`];
        answer.correct = dataObject[`correct${i}`] !== undefined ? true : false;
        finalDataObj.answers.push(answer);
    }

    return finalDataObj;
};
