window.addEventListener("load", () => {
    console.log("woooooo");
    document.getElementById("submit-button").onclick = () => {
        document.getElementById("confirmation-container").style = "display: unset";
    }
})