export function zip(arr1, arr2) {
    if (arr1.length < arr2.length) {
        return arr1.map((element, index) => [element, arr2[index]]);
    }
    return arr2.map((element, index) => [element, arr1[index]]);
}
