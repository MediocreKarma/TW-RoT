function addButtonToDocument() {
    var button = document.createElement('button');

    button.className = 'back-to-top';
    button.id = 'back-to-top';
    button.textContent = 'Înapoi sus';

    document.body.prepend(button);
}

document.addEventListener(
    'DOMContentLoaded',
    function () {
        addButtonToDocument();
        const backToTop = document.getElementById('back-to-top');
        if (backToTop == null) {
            return;
        }
        const bttMarginBottom = parseInt(
            window.getComputedStyle(backToTop).getPropertyValue('bottom')
        );

        const footer = document.getElementById('footer');

        window.onscroll = function () {
            handleScroll();
        };

        function handleScroll() {
            const viewportHeight = window.innerHeight;
            if (window.scrollY > viewportHeight * 0.8) {
                backToTop.classList.add('back-to-top--show');
            } else {
                backToTop.classList.remove('back-to-top--show');
            }
            if (footer == null) {
                return;
            }
            const footerStartPos = footer.getBoundingClientRect().y;
            if (window.innerHeight > footerStartPos) {
                backToTop.style.bottom = `${
                    window.innerHeight - footerStartPos + bttMarginBottom - 5
                }px`;
            } else {
                backToTop.style.bottom = '';
            }
        }

        function scrollToTop() {
            document.documentElement.scrollTo({
                top: 0,
                behavior: 'smooth',
            });
        }

        backToTop.addEventListener('click', scrollToTop);
    },
    false
);
