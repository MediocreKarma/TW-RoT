window.addEventListener("load", function () {
    const elems = document.getElementsByClassName("question-category");
    for (let i = 0; i < elems.length; ++i) {
        const elem = elems.item(i);
        const valueData = elem.getElementsByClassName("question-category__value");
        if (valueData.length > 1) {
            console.log("Error! Question category has too many values");
            continueș
        }
        if (valueData.length == 0) {
            continue;
        }
        const strData = valueData.item(0).innerHTML;
        if (!strData.includes("/")) {
            continue;
        }
        const values = valueData.item(0).innerHTML.split("/");
        if (values.length != 2) {
            console.log("Error! Value does not contain 2 integers separated by a '/'")
        }
        const percentage = parseInt(values[0]) / parseInt(values[1]) * 100;
        const fillerData = elem.getElementsByClassName("question-category__filler");
        if (fillerData.length != 1) {
            continue;
        }
        fillerData.item(0).style.width = percentage + "%";
    }
}, false);