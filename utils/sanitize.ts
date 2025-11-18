// utils/sanitize.ts
import sanitizeHtmlLib from "sanitize-html";

export const sanitizeHtml = (html: string): string => {
  return sanitizeHtmlLib(html, {
    allowedTags: [
      "p", "strong", "em", "u", "i", "b",
      "h3", "h4", "h5",
      "ul", "ol", "li",
      "blockquote", "code",
      "a", "img", "br", "span"
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
      "*": ["style"]
    },
    transformTags: {
      "a": sanitizeHtmlLib.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
    allowedSchemes: ["http", "https", "mailto"],
    enforceHtmlBoundary: true,
  });
};
