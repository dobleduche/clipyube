// server/services/analysisService.ts

// Export constants for configurability
export const MIN_WORD_COUNT = 1400;
export const MIN_LINKS = 2;
export const WORDS_PER_MINUTE = 200;

// Interfaces
export interface ValidationResult {
  isValid: boolean;
  reasons: string[];
  metadata: {
    wordCount: number;
    readTimeMinutes: number;
    keywordDensity: { keyword: string; count: number }[];
  };
}

/**
 * Validates a generated blog post's structure, keywords, and SEO fundamentals.
 */
export const validateBlogPost = (
  htmlContent: string,
  keywords: string[]
): ValidationResult => {
  if (!htmlContent || typeof htmlContent !== "string") {
    throw new Error("htmlContent must be a non-empty string.");
  }
  if (!Array.isArray(keywords) || keywords.length === 0) {
    throw new Error("keywords must be a non-empty array.");
  }

  const uniqueKeywords = [...new Set(keywords.map(k => String(k).trim()))];
  const reasons: string[] = [];

  // Strip HTML tags -> text-only
  const textContent = htmlContent
    .replace(/<script[\s\S]*?<\/script>/gi, "") // remove scripts
    .replace(/<style[\s\S]*?<\/style>/gi, "") // remove styles
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!textContent) {
    reasons.push("Content became empty after removing HTML tags.");
  }

  // Word count
  const wordCount = textContent
    ? textContent.split(" ").filter(Boolean).length
    : 0;

  if (wordCount < MIN_WORD_COUNT) {
    reasons.push(
      `Word count (${wordCount}) is below required minimum (${MIN_WORD_COUNT}).`
    );
  }

  // Estimated read time
  const readTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  // Count outbound links
  const linkMatches =
    htmlContent.match(/<a\s+[^>]*href=["']https?:\/\/[^"']+/gi) || [];

  if (linkMatches.length < MIN_LINKS) {
    reasons.push(
      `Found ${linkMatches.length} outbound link(s); minimum required is ${MIN_LINKS}.`
    );
  }

  // Compute keyword density
  const lower = textContent.toLowerCase();
  const keywordDensity = uniqueKeywords.map((keyword) => {
    const term = keyword.toLowerCase();
    const count =
      lower.match(new RegExp(`\\b${term}\\b`, "gi"))?.length ?? 0;
    return { keyword, count };
  });

  const missingKeywords = keywordDensity
    .filter((k) => k.count === 0)
    .map((k) => k.keyword);

  if (missingKeywords.length > 0) {
    reasons.push(
      `Missing required keywords: ${missingKeywords.join(", ")}.`
    );
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
