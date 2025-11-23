// server/services/analysisService.ts

// Export constants for configurability
export const MIN_WORD_COUNT = 1400;
export const MIN_LINKS = 2;
export const WORDS_PER_MINUTE = 200; // Average reading speed

// Define interfaces for type safety
interface ValidationResult {
  isValid: boolean;
  reasons: string[];
  metadata: {
    wordCount: number;
    readTimeMinutes: number;
    keywordDensity: { keyword: string; count: number }[];
  };
}

/**
 * Analyzes and validates a generated blog post.
 * @param htmlContent The sanitized HTML content of the blog post.
 * @param keywords An array of keywords to check for.
 * @returns A ValidationResult object.
 * @throws Error if inputs are invalid.
 */
export const validateBlogPost = (htmlContent: string, keywords: string[]): ValidationResult => {
  // Input validation
  if (!htmlContent || typeof htmlContent !== 'string') {
    throw new Error('htmlContent must be a non-empty string.');
  }
  if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
    throw new Error('keywords must be a non-empty array.');
  }
  const uniqueKeywords = [...new Set(keywords)]; // Remove duplicates

  const reasons: string[] = [];

  // 1. Calculate Word Count (stripping HTML tags)
  const textContent = htmlContent.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!textContent) {
    reasons.push('Content is empty after stripping HTML tags.');
  }
  const wordCount = textContent.split(' ').filter(word => word.length > 0).length;

  if (wordCount < MIN_WORD_COUNT) {
    reasons.push(`Word count is ${wordCount}, which is below the minimum of ${MIN_WORD_COUNT}.`);
  }

  // 2. Calculate Estimated Read Time
  const readTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  // 3. Check for Outbound Links
  const linkMatches = (htmlContent.match(/<a\s+(?:[^>]*?\s+)?href="https?:/gi) || []).length;
  if (linkMatches < MIN_LINKS) {
    reasons.push(`Found ${linkMatches} outbound link(s), which is below the minimum of ${MIN_LINKS}.`);
  }

  // 4. Check Keyword Density
  const lowerCaseText = textContent.toLowerCase();
  const keywordDensity = uniqueKeywords.map(keyword => {
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