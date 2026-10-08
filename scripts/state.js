/**
 * scripts/state.js
 */

export const CURRENCY_RATES = {
  RWF: { symbol: 'FRW ', rate: 1.0 },
  USD: { symbol: '$', rate: 1 / 1400.0 },
  EUR: { symbol: '€', rate: 1 / 1520.0 }
};

export const state = {
  records: [],
  filteredRecords: [],
  searchPattern: '',
  caseSensitive: false,
  sortField: 'date',
  sortDirection: 'desc',
  currentCurrency: 'RWF',
  monthlyCap: 50000.00,
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

export function getSortedRecords(recordsToSort) {
  const sorted = [...recordsToSort];
  const dir = state.sortDirection === 'asc' ? 1 : -1;

  sorted.sort((a, b) => {
    if (state.sortField === 'amount') {
      return (Number(a.amount) - Number(b.amount)) * dir;
    }
    if (state.sortField === 'date') {
      return (new Date(a.date) - new Date(b.date)) * dir;
    }
    const valA = String(a[state.sortField] || '').toLowerCase();
    const valB = String(b[state.sortField] || '').toLowerCase();
    return valA.localeCompare(valB) * dir;
  });

  return sorted;
}