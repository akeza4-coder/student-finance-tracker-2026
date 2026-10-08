/**
 * scripts/state.js
 * In-memory state store and data mutations
 */

export const CURRENCY_RATES = {
  USD: { symbol: '$', rate: 1.0 },
  RWF: { symbol: 'FRw ', rate: 1400.0 },
  EUR: { symbol: '€', rate: 0.92 }
};

export const state = {
  records: [],
  filteredRecords: [],
  searchPattern: '',
  caseSensitive: false,
  sortField: 'date',
  sortDirection: 'desc', // 'asc' | 'desc'
  currentCurrency: 'USD',
  monthlyCap: 500.00,
  editingId: null
};

export function setRecords(newRecords) {
  state.records = [...newRecords];
}

export function addRecord(record) {
  state.records.unshift(record);
}

export function updateRecord(id, updatedFields) {
  const index = state.records.findIndex(r => r.id === id);
  if (index !== -1) {
    state.records[index] = {
      ...state.records[index],
      ...updatedFields,
      updatedAt: new Date().toISOString()
    };
  }
}

export function deleteRecord(id) {
  state.records = state.records.filter(r => r.id !== id);
}

/**
 * Sorts records in-place or copies
 * @param {string} field
 */
export function toggleSort(field) {
  if (state.sortField === field) {
    state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
  } else {
    state.sortField = field;
    state.sortDirection = 'asc';
  }
}

export function getSortedRecords(recordsToSort) {
  const sorted = [...recordsToSort];
  const dir = state.sortDirection === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    if (state.sortField === 'amount') {
      return (a.amount - b.amount) * dir;
    }
    if (state.sortField === 'date') {
      return (new Date(a.date) - new Date(b.date)) * dir;
    }
    // String comparison (description, category)
    const valA = String(a[state.sortField] || '').toLowerCase();
    const valB = String(b[state.sortField] || '').toLowerCase();
    return valA.localeCompare(valB) * dir;
  });

  return sorted;
}