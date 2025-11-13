
/**
 * Converts a File object to a base64 encoded string, without the data URL prefix.
 * @param file The File object to convert.
 * @returns A promise that resolves with the base64 string.
 */
export const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
            const result = reader.result as string;
            // The result from readAsDataURL is in the format "data:image/jpeg;base64,LzlqLzRBQ...".
            // We need to strip the "data:[mime/type];base64," part.
            const base64String = result.split(',')[1];
            if (base64String) {
                resolve(base64String);
            } else {
                reject(new Error("Failed to extract base64 string from file."));
            }
        };
        reader.onerror = (error) => reject(new Error(`Failed to read file: ${error}`));
    });
};

/**
 * Converts a data URL string to a File object.
 * @param dataUrl The data URL to convert.
 * @param filename The desired filename for the new File object.
 * @returns A promise that resolves with the File object.
 */
export const dataUrlToFile = async (dataUrl: string, filename: string): Promise<File> => {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
};
