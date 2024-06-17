const API_URL = 'http://localhost:12734/api/v1';

const fetchSignup = async (data) => {
    const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: JSON.stringify(data),
    });
    return response;
};

const onFormSubmit = async (event) => {
    event.preventDefault();
    // send request to backend
    // if successful, redirect to login

    const data = new FormData(event.target);
    const dataObject = Object.fromEntries(data.entries());

    const response = await fetchSignup({
        username: dataObject.name,
        password: dataObject.password,
        email: dataObject.email,
    });

    if (!response.ok) {
        console.log('Response unsuccessful');
        console.log(response);
        return;
    }
    console.log(response);
    window.location.href = '/login';
};

window.addEventListener('load', () => {
    const form = document.getElementById('signup-form');

    // TODO make a function that shows an InfoModal at the top of the page or whatever

    form.addEventListener('submit', onFormSubmit);
});
