// Jin categories/subcategories mein condition ka koi matlab nahi
export const NO_CONDITION_KEYWORDS = [
  "animal", "bird", "job", "service", "website", "web development",
  "software", "design", "freelance", "course", "marketing",
];

// true = condition dikhao, false = hide karo
export const categoryNeedsCondition = (...names) =>
  !names
    .filter(Boolean)
    .some((n) => NO_CONDITION_KEYWORDS.some((k) => n.toLowerCase().includes(k)));