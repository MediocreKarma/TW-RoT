export default function headerToHamburger() {
    let header = document.getElementById('header');
    header.classList.remove('header--no-js');
    const elements = header.children;
    let desktop_media_size = 80;
    for (let i = 0; i < elements.length; ++i) {
        const elem = elements.item(i);
        desktop_media_size += elem.getBoundingClientRect().width;
    }
    let media_query = window.matchMedia(
        '(max-width: ' + desktop_media_size + 'px)'
    );
    const mobile_view = 'header--mobile-view';
    if (media_query.matches) {
        header.classList.add(mobile_view);
    }

    media_query.addEventListener(
        'change',
        function () {
            if (media_query.matches) {
                header.classList.add(mobile_view);
            } else {
                header.classList.remove(mobile_view);
            }
        },
        false
    );
}
