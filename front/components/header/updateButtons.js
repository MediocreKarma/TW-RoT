import { cachedUserData } from '/js/auth.js';

export default function updateButtons() {
    let header = document.getElementById('header');

    const user = cachedUserData();
    if (!user) {
        return;
    }

    let loginLinkLi = header.querySelector('#header-login');
    let loginLink = loginLinkLi.querySelector('a');
    loginLink.href = '/logout'; // TODO: Logout page
    loginLink.innerText = 'Delogare';

    let profileLinkLi = loginLinkLi.cloneNode(true);
    let profileLink = profileLinkLi.querySelector('a');
    profileLink.href = '/profile';
    profileLink.innerText = '';

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
}
