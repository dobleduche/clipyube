/**
 * A simple HTML sanitizer to remove potentially dangerous tags and attributes.
 * This is a basic implementation and not as robust as a library like DOMPurify,
 * but it serves to prevent common XSS attack vectors without adding external dependencies.
 * @param dirtyHtml The potentially unsafe HTML string from an AI model.
 * @returns A sanitized HTML string.
 */
export const sanitizeHtml = (dirtyHtml: string): string => {
    if (!dirtyHtml) return '';

    // 1. Remove script tags and their content
    let sanitized = dirtyHtml.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');

    // 2. Remove inline event handlers (e.g., onload, onerror, onclick)
    sanitized = sanitized.replace(/on\w+="[^"]*"/gi, '');
    sanitized = sanitized.replace(/on\w+='[^']*'/gi, '');

    // 3. Remove other dangerous tags like <style>, <link>, <iframe>, <object>, <embed>
    sanitized = sanitized.replace(/<\/?(style|link|iframe|object|embed)\b[^>]*>/gi, '');

    // 4. (Optional) You could implement a whitelist of allowed tags if needed,
    // but for now, we focus on removing the most common threats.
    // The current allowed tags are <p>, <h3>, <ul>, <ol>, <li>, <strong> which are generally safe.

    return sanitized;
};