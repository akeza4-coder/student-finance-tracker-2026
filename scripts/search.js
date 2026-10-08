/**
 * scripts/search.js
 * Safe regex compilation, live matching, and text highlighting
 */

/**
 * Safely compiles a regular expression from user input
 * @param {string} pattern
 * @param {boolean} caseSensitive
 * @returns {{ regex: RegExp|null, error: string|null }}
 */
export function compileRegex(pattern, caseSensitive = false) {
  if (!pattern || !pattern.trim()) {
    return { regex: null, error: null };
  }

  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const regex = new RegExp(pattern, flags);
    return { regex, error: null };
  } catch (err) {
    return { regex: null, error: err.message };
  }
}

/**
 * Wraps matching parts of a text in <mark> tags safely
 * @param {string} text
 * @param {RegExp|null} regex
 * @returns {string}
 */
export function highlightText(text, regex) {
  const str = String(text ?? '');
  if (!regex || !str) return str;

  try {
    return str.replace(regex, match => `<mark>${match}</mark>`);
  } catch {
    return str;
  }
}

/**
 * Filters a list of records using compiled regex across text & numeric fields
 * @param {Array} records
 * @param {RegExp|null} regex
 * @returns {Array}
 */
export function filterRecordsByRegex(records, regex) {
  if (!regex) return records;

  return records.filter(record => {
    const descMatch = regex.test(record.description);
    regex.lastIndex = 0; // Reset state for global regex
    const catMatch = regex.test(record.category);
    regex.lastIndex = 0;
    const amountMatch = regex.test(String(record.amount));
    regex.lastIndex = 0;
    const dateMatch = regex.test(record.date);
    regex.lastIndex = 0;

    return descMatch || catMatch || amountMatch || dateMatch;
  });
}