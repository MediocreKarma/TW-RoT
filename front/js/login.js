const API_URL = 'http://localhost:12734/api/v1';

const fetchLogin = async (data) => {
    const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response;
};

const onFormSubmit = async (event) => {
    console.log('here');
    event.preventDefault();
    // send request to backend
    // if successful, redirect to login

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    const response = await fetchLogin(dataObject);

    if (!response.ok) {
        console.log('rip');
        console.log(response);
        return;
    }
    console.log(response);

    const responseData = await response.json();

    // get thingy, put in localStorage, whatever
    localStorage.setItem('token', responseData.id);
    window.location.href = './index.html';
};

window.addEventListener('load', () => {
    const form = document.getElementById('login-form');

    // TODO make a function that shows an InfoModal at the top of the page or whatever

    form.addEventListener('submit', onFormSubmit);
});
