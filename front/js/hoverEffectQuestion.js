function assignHoverColor(evt) {
    var checkbox = evt.currentTarget.cbox;
    var label = evt.currentTarget.label;
    if (!checkbox.checked) {
        label.style['background-color'] = '#f0c395';
    }
}

function unassignHoverColor(evt) {
    var label = evt.currentTarget.label;
    label.style['background-color'] = null;
}

window.addEventListener(
    'load',
    function () {
        for (const ch of ['a', 'b', 'c']) {
            id = `option-${ch}`;
            let cbox = document.getElementById(id);
            let label = document.getElementById(id + '-label');
            if (cbox == null || label == null) {
                continue;
            }
            label.cbox = cbox;
            label.label = label;
            label.addEventListener('mouseover', assignHoverColor, false);
            label.addEventListener('mouseout', unassignHoverColor, false);
            label.addEventListener(
                'click',
                function () {
                    label.style['background-color'] = null;
                },
                false
            );
        }
    },
    false
);
