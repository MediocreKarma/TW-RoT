
window.addEventListener("load", () => {
    var darkSwitch = document.getElementById("header__dark-switch__input");

    setThemeLocally = () => {
        var isDarkThemeSelected = localStorage.getItem("darkSwitch") !== null &&
        localStorage.getItem("darkSwitch") === "dark";

        darkSwitch.checked = isDarkThemeSelected;
        if (isDarkThemeSelected) {
            document.body.setAttribute("data-theme", "dark");
        }
        else {
            document.body.setAttribute("data-theme", "light");
        }
    }

    switchTheme = () => {
        if (darkSwitch.checked) {
            document.body.setAttribute("data-theme", "dark");
            localStorage.setItem("darkSwitch", "dark");
          } else {
            document.body.setAttribute("data-theme", "light");
            localStorage.setItem("darkSwitch", "light");
          }
    }

    if (darkSwitch) {
        setThemeLocally();
    }
    darkSwitch.addEventListener("change", () => {
        switchTheme();
    })
});