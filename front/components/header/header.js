import darkModeSwitch from './darkModeSwitch.js';
import headerToHamburger from './headerToHamburger.js';

document.addEventListener('DOMContentLoaded', () => {
    try {
        fetch('/components/header/header.html')
            .then((response) => response.text())
            .then((html) => {
                document.getElementById('header').innerHTML = html;
                darkModeSwitch();
                headerToHamburger();
            });
    } catch (e) {
        console.log(e);
    }
});
