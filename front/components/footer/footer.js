document.addEventListener('DOMContentLoaded', () => {
    try {
        fetch('/components/footer/footer.html')
            .then((response) => response.text())
            .then((html) => {
                document.getElementById('footer').innerHTML = html;
            });
    } catch (e) {
        console.log(e);
    }
});
