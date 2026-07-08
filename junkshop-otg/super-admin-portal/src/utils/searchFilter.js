/** True when any whitespace-separated word in `text` starts with `query`. */
export function textMatchesPrefixWords(text, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;

  const normalized = String(text ?? '').toLowerCase().trim();
  if (!normalized) return false;

  return normalized.split(/\s+/).some((word) => word.startsWith(q));
}

/** True when any value (or nested array item) has a word starting with `query`. */
export function matchesPrefixWordSearch(values, query) {
  const q = String(query ?? '').trim().toLowerCase();
  if (!q) return true;

  const list = Array.isArray(values) ? values : [values];
  return list.some((value) => {
    if (value == null || value === '') return false;
    if (Array.isArray(value)) {
      return value.some((item) => textMatchesPrefixWords(item, q));
    }
    return textMatchesPrefixWords(value, q);
  });
}
