window.addEventListener("load", () => {
    var backToTop = document.getElementById("back-to-top");
    console.log("yes");
    console.log(backToTop);
    handleScroll = () => {
        const viewportHeight = window.innerHeight;
        if (window.scrollY > viewportHeight * 0.8) {
            backToTop.classList.add("back-to-top--show");
        }
        else {
            backToTop.classList.remove("back-to-top--show");
        }
    }
    document.addEventListener("scroll", handleScroll);

    function scrollToTop() {
        document.documentElement.scrollTo({
          top: 0,
          behavior: "smooth"
        })
      };

    backToTop.addEventListener("click", scrollToTop);
})

