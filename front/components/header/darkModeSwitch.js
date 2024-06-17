export default function darkModeSwitch() {
    const darkSwitch = document.getElementById('header__dark-switch-input');
    if (darkSwitch == null) {
        return;
    }

    const setThemeLocally = () => {
        var isDarkThemeSelected =
            localStorage.getItem('darkSwitch') !== null &&
            localStorage.getItem('darkSwitch') === 'dark';

        darkSwitch.checked = isDarkThemeSelected;
        if (isDarkThemeSelected) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.setAttribute('data-theme', 'light');
        }
    };

    const switchTheme = () => {
        if (darkSwitch.checked) {
            document.body.setAttribute('data-theme', 'dark');
            localStorage.setItem('darkSwitch', 'dark');
        } else {
            document.body.setAttribute('data-theme', 'light');
            localStorage.setItem('darkSwitch', 'light');
        }
    };

    if (darkSwitch) {
        setThemeLocally();
    }
    darkSwitch.addEventListener('change', () => {
        switchTheme();
    });
}
