/**
 * Fuzzy matching between a user-supplied ritual name (often spoken, accented, or
 * paraphrased) and the user's actual rituals. Pure and dependency-free so it can
 * be unit-tested in isolation; `resolveRitualByName` feeds it the live list.
 *
 * Strategy: normalize (lowercase, strip accents/punctuation), then score each
 * ritual by the strongest of three signals:
 *  - containment ("run" inside "Morning run"),
 *  - token coverage, both directions, so word order and extra words are tolerated
 *    ("how much book of the Bible have I read" → "Read a book of the Bible"),
 *  - trigram similarity, for typos and accent variants ("Proteins" → "Protéines").
 *
 * A clear winner resolves directly; close contenders become disambiguation
 * candidates (the chat renders tappable chips); nothing plausible is "not found".
 * Favouring confirmation over a silent guess matters most for voice input.
 */

export type Named = { id: string; name: string };

export type RitualMatch<T extends Named> =
  | { status: "ok"; ritual: T }
  | { status: "ambiguous"; candidates: T[] }
  | { status: "not_found" };

// A match this strong, clearly ahead of the runner-up, resolves without asking.
const STRONG = 0.82;
// Below this a candidate is noise and is never offered.
const WEAK = 0.5;
// The winner must beat the runner-up by this margin to skip disambiguation.
const MARGIN = 0.12;
// Two tokens this similar count as "the same word" (accents, plurals, typos).
const TOKEN_SIMILARITY = 0.7;
const MAX_CANDIDATES = 4;

// Filler words that carry no ritual identity, in the app's two languages. Removing
// them lets "book of the Bible" align with "Read a book of the Bible".
const STOPWORDS = new Set([
  // English
  "a", "an", "the", "of", "to", "and", "my", "this", "that", "have", "i",
  "is", "on", "in", "for", "me", "do", "did", "how", "much", "many", "times",
  // French
  "le", "la", "les", "un", "une", "de", "des", "du", "ma", "mon", "mes", "ce",
  "cette", "ces", "et", "au", "aux", "je", "tu", "as", "ai", "combien", "fois",
]);

/** Lowercase, strip diacritics, replace punctuation with spaces, collapse runs. */
function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Content tokens (stopwords removed); falls back to all tokens if that empties it. */
function contentTokens(normalized: string): string[] {
  const all = normalized ? normalized.split(" ") : [];
  const content = all.filter((token) => !STOPWORDS.has(token));
  return content.length > 0 ? content : all;
}

function trigrams(value: string): Set<string> {
  const padded = `  ${value} `;
  const grams = new Set<string>();
  for (let i = 0; i < padded.length - 2; i++) grams.add(padded.slice(i, i + 3));
  return grams;
}

/** Dice coefficient over trigram sets: 0 (disjoint) to 1 (identical). */
function trigramSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const ga = trigrams(a);
  const gb = trigrams(b);
  let shared = 0;
  for (const gram of ga) if (gb.has(gram)) shared++;
  return (2 * shared) / (ga.size + gb.size);
}

/** Fraction of `needles` present in `haystack`, allowing fuzzy token equality. */
function coverage(needles: string[], haystack: string[]): number {
  if (needles.length === 0) return 0;
  const matched = needles.filter((needle) =>
    haystack.some(
      (token) =>
        token === needle || trigramSimilarity(needle, token) >= TOKEN_SIMILARITY,
    ),
  ).length;
  return matched / needles.length;
}

function score(queryNorm: string, queryTokens: string[], name: string): number {
  const nameNorm = normalize(name);
  if (!nameNorm) return 0;
  if (queryNorm === nameNorm) return 1;

  const nameTokens = contentTokens(nameNorm);
  const contained =
    nameNorm.includes(queryNorm) || queryNorm.includes(nameNorm) ? 0.92 : 0;
  // Bidirectional: the query mentions all of the ritual's words, or vice versa.
  const tokenScore =
    0.95 *
    Math.max(
      coverage(queryTokens, nameTokens),
      coverage(nameTokens, queryTokens),
    );
  const fuzzy = trigramSimilarity(queryNorm, nameNorm);

  return Math.max(contained, tokenScore, fuzzy);
}

export function matchRitualByName<T extends Named>(
  rawQuery: string,
  rituals: T[],
): RitualMatch<T> {
  const queryNorm = normalize(rawQuery);
  if (!queryNorm || rituals.length === 0) return { status: "not_found" };

  const queryTokens = contentTokens(queryNorm);
  const ranked = rituals
    .map((ritual) => ({ ritual, score: score(queryNorm, queryTokens, ritual.name) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < WEAK) return { status: "not_found" };

  const runnerUp = ranked[1];
  const isClearWinner =
    best.score >= STRONG && (!runnerUp || best.score - runnerUp.score >= MARGIN);
  if (isClearWinner) return { status: "ok", ritual: best.ritual };

  const candidates = ranked
    .filter((entry) => entry.score >= WEAK)
    .slice(0, MAX_CANDIDATES)
    .map((entry) => entry.ritual);

  return { status: "ambiguous", candidates };
}
