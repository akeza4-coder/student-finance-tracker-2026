/**
 * scripts/storage.js
 * Persistence and JSON Import/Export handling
 */

const STORAGE_KEY = 'fintrack:records';
const CAP_KEY = 'fintrack:monthly_cap';
const CURRENCY_KEY = 'fintrack:currency';

/**
 * Loads records from localStorage, falling back to seed data if empty
 * @param {Array} fallbackSeed
 * @returns {Array}
 */
export function loadRecords(fallbackSeed = []) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallbackSeed;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallbackSeed;
  } catch (e) {
    console.error('Failed to parse storage, loading seed instead:', e);
    return fallbackSeed;
  }
}

/**
 * Persists records array to localStorage
 * @param {Array} records
 */
export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (e) {
    console.error('Could not save to localStorage:', e);
  }
}

/**
 * Loads monthly cap and active currency preferences
 */
export function loadPreferences() {
  const cap = parseFloat(localStorage.getItem(CAP_KEY)) || 500.00;
  const currency = localStorage.getItem(CURRENCY_KEY) || 'USD';
  return { cap, currency };
}

export function savePreferences(cap, currency) {
  localStorage.setItem(CAP_KEY, String(cap));
  localStorage.setItem(CURRENCY_KEY, currency);
}

/**
 * Exports data to a downloadable JSON file
 * @param {Array} records
 */
export function exportToJSON(records) {
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `fintrack_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

/**
 * Validates the schema of an imported JSON array
 * @param {Array} data
 * @returns {boolean}
 */
export function validateImportedJSON(data) {
  if (!Array.isArray(data)) return false;
  return data.every(item => (
    typeof item.id === 'string' &&
    typeof item.description === 'string' &&
    typeof item.amount === 'number' &&
    typeof item.category === 'string' &&
    typeof item.date === 'string'
  ));
}