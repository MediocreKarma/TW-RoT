window.onload = function() { 
    let elem = document.getElementById("select-id");
    let target  = document.getElementById("comparison__target");
    let results = document.getElementById("comparison__results");
    
    
    target.style["display"] = "none";
    results.style["display"] = "none";

    elem.addEventListener("change", function () {

        if (elem.value == 0) {
            target.style["display"] = "none";
            results.style["display"] = "none";
        }
        else {
            target.style["display"] = "flex";
            results.style["display"] = "flex";
        }
    }, false);
}