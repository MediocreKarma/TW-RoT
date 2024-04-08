function toggleNavbarMenu() {
    let idStr = "navbar__list";
    let classStr = idStr;
    let navbarList = document.getElementById("navbar__list");
    if (navbarList.className === classStr) {
        navbarList.className += " menu";
    }
    else {
        navbarList.className = classStr;
    }
}