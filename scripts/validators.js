/**
 * scripts/validators.js
 * Regular expression schemas and validation helpers
 */

export const REGEX_PATTERNS = {
  // Rule 1: No leading/trailing spaces and collapse doubles
  description: /^\S(?:.*\S)?$/,

  // Rule 2: Non-negative amount with up to 2 decimal places
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,

  // Rule 3: Strict ISO date YYYY-MM-DD
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,

  // Rule 4: Category/tag (letters, spaces, hyphens)
  category: /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/,

  // Rule 5 (Advanced): Back-reference to detect duplicated consecutive words
  duplicateWords: /\b(\w+)\s+\1\b/i
};

/**
 * Validates a single transaction field value
 * @param {string} field - 'description' | 'amount' | 'date' | 'category'
 * @param {string|number} value - The input value
 * @returns {{ isValid: boolean, error: string }}
 */
export function validateField(field, value) {
  const strVal = String(value ?? '').trim();

  if (!strVal) {
    return { isValid: false, error: `${field.charAt(0).toUpperCase() + field.slice(1)} cannot be empty.` };
  }

  switch (field) {
    case 'description':
      if (!REGEX_PATTERNS.description.test(String(value))) {
        return { isValid: false, error: 'Cannot have leading or trailing whitespace.' };
      }
      if (REGEX_PATTERNS.duplicateWords.test(strVal)) {
        return { isValid: false, error: 'Contains accidental repeated words (e.g., "coffee coffee").' };
      }
      return { isValid: true, error: '' };

    case 'amount':
      if (!REGEX_PATTERNS.amount.test(strVal) || parseFloat(strVal) <= 0) {
        return { isValid: false, error: 'Enter a valid positive number with up to 2 decimal places.' };
      }
      return { isValid: true, error: '' };

    case 'date':
      if (!REGEX_PATTERNS.date.test(strVal)) {
        return { isValid: false, error: 'Date must be formatted as YYYY-MM-DD.' };
      }
      return { isValid: true, error: '' };

    case 'category':
      if (!REGEX_PATTERNS.category.test(strVal)) {
        return { isValid: false, error: 'Letters, single spaces, or hyphens only.' };
      }
      return { isValid: true, error: '' };

    default:
      return { isValid: true, error: '' };
  }
}

/**
 * Validates a full transaction record object
 * @param {Object} record
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateRecord(record) {
  const errors = {};
  const fields = ['description', 'amount', 'date', 'category'];

  fields.forEach(f => {
    const res = validateField(f, record[f]);
    if (!res.isValid) {
      errors[f] = res.error;
    }
  });

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}