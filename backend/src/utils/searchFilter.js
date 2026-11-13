// Words that don't help narrow a search ("Report a scam" -> ["report", "scam"])
const STOP_WORDS = new Set([
  "a", "an", "the", "to", "of", "for", "my", "your", "how", "do", "does",
  "i", "is", "in", "on", "and", "or", "can", "what", "with", "me",
]);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getSearchTokens = (query) => {
  const tokens = query
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.replace(/[^\w]/g, ""))
    .filter((word) => word && !STOP_WORDS.has(word));

  // If the query was only stop words (e.g. "how to"), fall back to the raw text
  return tokens.length ? [...new Set(tokens)] : [query.trim().toLowerCase()];
};

// Every word must appear (at the start of a word) in the title, content or tags.
// "boost listing" matches "boost your listing", "scam" matches "scams", etc.
const buildSearchFilter = (query) => ({
  $and: getSearchTokens(query).map((token) => {
    const pattern = `\\b${escapeRegex(token)}`;
    return {
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { content: { $regex: pattern, $options: "i" } },
        { tags: { $regex: pattern, $options: "i" } },
      ],
    };
  }),
});

module.exports = { buildSearchFilter, getSearchTokens };