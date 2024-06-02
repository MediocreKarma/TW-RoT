export function zip(arr1, arr2) {
    return arr1.map((element, index) => [element, arr2[index]]);
}
