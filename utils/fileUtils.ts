/**
 * Converts a File to a base64 string (strip data URL prefix).
 */
export const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      if (!result || !result.includes(",")) {
        return reject(new Error("Invalid file data URL format."));
      }

      const base64 = result.split(",")[1];
      if (!base64) {
        return reject(new Error("Failed to extract base64 from File."));
      }

      resolve(base64);
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file."));
    };

    reader.readAsDataURL(file);
  });

/**
 * Converts a Data URL → File object.
 */
export const dataUrlToFile = async (
  dataUrl: string,
  filename: string
): Promise<File> => {
  if (!dataUrl.startsWith("data:")) {
    throw new Error("Invalid data URL format.");
  }

  const res = await fetch(dataUrl);
  if (!res.ok) {
    throw new Error("Failed to convert data URL to File.");
  }

  const blob = await res.blob();
  return new File([blob], filename, { type: blob.type });
};
