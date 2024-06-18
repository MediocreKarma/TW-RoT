window.addEventListener('load', () => {
    let button = document.getElementById('submit-button');
    if (button == null) {
        return;
    }
    button.onclick = () => {
        document.getElementById('confirmation-container').style =
            'display: unset';
    };
});
