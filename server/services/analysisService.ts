// server/services/analysisService.ts

interface ValidationResult {
    isValid: boolean;
    reasons: string[];
    metadata: {
        wordCount: number;
        readTimeMinutes: number;
        keywordDensity: { keyword: string, count: number }[];
    };
}

const MIN_WORD_COUNT = 800;
const MIN_LINKS = 2;

/**
 * Analyzes and validates a generated blog post.
 * @param htmlContent The sanitized HTML content of the blog post.
 * @param keywords An array of keywords to check for.
 * @returns A ValidationResult object.
 */
export const validateBlogPost = (htmlContent: string, keywords: string[]): ValidationResult => {
    const reasons: string[] = [];
    
    // 1. Calculate Word Count (stripping HTML tags)
    const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const wordCount = textContent.split(' ').length;

    if (wordCount < MIN_WORD_COUNT) {
        reasons.push(`Word count is ${wordCount}, which is below the minimum of ${MIN_WORD_COUNT}.`);
    }

    // 2. Calculate Estimated Read Time
    const readTimeMinutes = Math.ceil(wordCount / 200); // Average reading speed

    // 3. Check for Outbound Links
    const linkMatches = htmlContent.match(/<a\s+(?:[^>]*?\s+)?href="https:?/gi) || [];
    if (linkMatches.length < MIN_LINKS) {
        reasons.push(`Found ${linkMatches.length} outbound link(s), which is below the minimum of ${MIN_LINKS}.`);
    }

    // 4. Check Keyword Density
    const lowerCaseText = textContent.toLowerCase();
    const keywordDensity = keywords.map(keyword => {
        const lowerCaseKeyword = keyword.toLowerCase();
        const count = (lowerCaseText.match(new RegExp(`\\b${lowerCaseKeyword}\\b`, 'g')) || []).length;
        return { keyword, count };
    });

    const keywordsNotFound = keywordDensity.filter(kd => kd.count === 0);
    if (keywordsNotFound.length > 0) {
        reasons.push(`The following keywords were not found: ${keywordsNotFound.map(k => k.keyword).join(', ')}.`);
    }

    return {
        isValid: reasons.length === 0,
        reasons,
        metadata: {
            wordCount,
            readTimeMinutes,
            keywordDensity,
        },
    };
};
