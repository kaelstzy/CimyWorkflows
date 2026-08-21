/**
 * Turns conversation content into a deduplicated set of lowercase word
 * tokens, stored alongside each document as `searchTokens`. This lets
 * search run as a server-side Firestore query (array-contains-any)
 * instead of ever pulling the full dataset into the browser.
 *
 * This is a simple, dependency-free approach — good enough for a personal
 * dataset tool, not a substitute for a real search index. Firestore also
 * caps `array-contains-any` at 30 comparison values, which the search
 * query code respects.
 */
export function tokenize(text: string): string[] {
  return Array.from(
    new Set(
      text
        .toLowerCase()
        .normalize("NFKD")
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((word) => word.length >= 2)
    )
  );
}

export function buildSearchTokens(id: string, messages: { content: string }[]): string[] {
  const contentTokens = messages.flatMap((m) => tokenize(m.content));
  const idTokens = tokenize(id);
  // Cap the stored token set to keep documents small.
  return Array.from(new Set([...idTokens, ...contentTokens])).slice(0, 200);
}
