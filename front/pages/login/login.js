import API from '/js/api.js';
import { post } from '/js/requests.js';

const fetchLogin = async (data) => {
    const response = await post(`${API.AUTH}/auth/login`, data);
    return await response.json();
};

const onFormSubmit = async (event) => {
    event.preventDefault();

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    try {
        const response = await fetchLogin(dataObject);
        console.log(response);
        // todo: probably some util functions to work with localStorage stuff
        localStorage.setItem('userId', response.user.id);
        localStorage.setItem('userFlags', response.user.flags);
        localStorage.setItem('userUsername', response.user.username);
        window.location.href = '/';
    } catch (e) {
        console.log(e);
        // create modal in which to show error...
        // showError(e);
    }
};

window.addEventListener('load', () => {
    const form = document.querySelector('form');

    // TODO make a function that shows an InfoModal at the top of the page or whatever

    form.onsubmit = onFormSubmit;
});
