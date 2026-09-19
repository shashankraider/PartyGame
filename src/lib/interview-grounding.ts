/** Permit typographic punctuation differences, never added or paraphrased words. */
export function isQuotedSubstring(source: string, quote: string): boolean {
  const normalize = (text: string) => text.normalize('NFKC').replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').toLowerCase().trim();
  const span = normalize(quote).replace(/[.!?。।]+$/u, '').trim();
  return span.length > 0 && normalize(source).includes(span);
}
