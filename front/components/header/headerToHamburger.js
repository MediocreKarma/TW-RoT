export default function headerToHamburger() {
    let header = document.getElementById('header');
    header.classList.remove('header--no-js');
    const elements = header.children;
    let desktop_media_size = 80;
    for (let i = 0; i < elements.length; ++i) {
        const elem = elements.item(i);
        desktop_media_size += elem.getBoundingClientRect().width;
    }
    console.log(desktop_media_size);
    let media_query = window.matchMedia(
        '(max-width: ' + desktop_media_size + 'px)'
    );
    const desktop_class = 'header--mobile-view';
    if (media_query.matches) {
        header.classList.add(desktop_class);
    }

    media_query.addEventListener(
        'change',
        function () {
            if (media_query.matches) {
                header.classList.add(desktop_class);
            } else {
                header.classList.remove(desktop_class);
            }
        },
        false
    );
}
