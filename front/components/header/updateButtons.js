import { cachedUserData, isAdmin } from '/js/auth.js';

export default function updateButtons() {
    let header = document.getElementById('header');

    const user = cachedUserData();
    if (!user) {
        return;
    }

    let loginLinkLi = header.querySelector('#header-login');
    let loginLink = loginLinkLi.querySelector('a');
    loginLink.href = '/logout';
    loginLink.innerText = 'Delogare';
    loginLink.id = 'header-logout';

    let profileLinkLi = loginLinkLi.cloneNode(true);
    let profileLink = profileLinkLi.querySelector('a');
    profileLink.href = '/profile';
    profileLink.innerText = '';
    delete profileLink.id;

    let profileText = document.createElement('span');
    profileText.innerText = 'Profil (';
    profileLink.appendChild(profileText);

    let bold = document.createElement('strong');
    bold.innerText = '@' + user.username;
    profileLink.appendChild(bold);

    profileText = document.createElement('span');
    profileText.innerText = ')';
    profileLink.appendChild(profileText);

    loginLinkLi.parentNode.insertBefore(profileLinkLi, loginLinkLi);

    if (!isAdmin()) {
        return;
    }

    let usersLinkLi = loginLinkLi.cloneNode(true);
    let usersLink = usersLinkLi.querySelector('a');
    usersLink.href = '/dashboard/users';
    usersLink.innerText = 'Utilizatori';

    let exercisesLinkLi = loginLinkLi.cloneNode(true);
    let exercisesLink = exercisesLinkLi.querySelector('a');
    exercisesLink.href = '/dashboard/exercises';
    exercisesLink.innerText = 'Întrebări';

    loginLinkLi.parentNode.insertBefore(usersLinkLi, loginLinkLi);
    loginLinkLi.parentNode.insertBefore(exercisesLinkLi, loginLinkLi);
}
