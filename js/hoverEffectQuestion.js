function assignHoverColor(evt) {
    var checkbox = evt.currentTarget.cbox;
    var label    = evt.currentTarget.label;
    whiteBackground = function() {
        label.style["background-color"] = "white";
    }
    coloredBackground = function() {
        label.style["background-color"] = null;
    }
    if (!checkbox.checked) {
        label.style["background-color"] = "#f0c395";
        label.removeEventListener('click', whiteBackground);
        label.addEventListener('click', coloredBackground, false);
    }
    if (checkbox.checked) {
        label.removeEventListener('click', coloredBackground);
        label.addEventListener('click', whiteBackground, false);
    }
}

function unassignHoverColor(evt) {
    var checkbox = evt.currentTarget.cbox;
    var label    = evt.currentTarget.label;
    if (!checkbox.checked) {
        label.style["background-color"] = "white";
    }
}

window.onload = (function() {
    for (const ch of ['a', 'b', 'c']) {
        id = `option-${ch}`;
        let cbox    = document.getElementById(id);
        let label   = document.getElementById(id + '-label');
        label.cbox  = cbox;
        label.label = label;
        label.addEventListener("mouseenter", assignHoverColor, false);
        label.addEventListener("mouseleave", unassignHoverColor, false);
    }
})
