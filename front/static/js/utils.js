export const readFileIntoString = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onerror = () => {
            reader.abort();
            reject(new Error('Invalid file'));
        }
        reader.onload = () => {
            resolve(reader.result);
        }
        reader.readAsText(file);
    });
} 