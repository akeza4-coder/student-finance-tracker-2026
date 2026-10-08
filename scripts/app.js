/**
 * scripts/app.js
 * Application bootstrap and primary event handling
 */

import { state, setRecords, addRecord, updateRecord, deleteRecord, toggleSort, getSortedRecords } from './state.js';
import { loadRecords, saveRecords, loadPreferences, savePreferences, exportToJSON, validateImportedJSON } from './storage.js';
import { compileRegex, filterRecordsByRegex } from './search.js';
import { validateField, validateRecord } from './validators.js';
import { renderRecordsTable, renderDashboardStats, announceLive } from './ui.js';

async function init() {
  // Load seed data if storage is empty
  let initialData = [];
  try {
    const res = await fetch('seed.json');
    initialData = await res.json();
  } catch (err) {
    console.warn('Seed file could not be fetched:', err);
  }

  const loaded = loadRecords(initialData);
  setRecords(loaded);

  const { cap, currency } = loadPreferences();
  state.monthlyCap = cap;
  state.currentCurrency = currency;

  // Sync settings inputs
  const capInput = document.getElementById('settings-cap');
  const currencySelect = document.getElementById('currency-select');
  if (capInput) capInput.value = state.monthlyCap;
  if (currencySelect) currencySelect.value = state.currentCurrency;

  setupNavigation();
  setupForm();
  setupSearchAndSort();
  setupSettings();
  refreshUI();
}

function refreshUI() {
  const { regex, error } = compileRegex(state.searchPattern, state.caseSensitive);
  const regexStatus = document.getElementById('regex-status');

  if (regexStatus) {
    if (error) {
      regexStatus.textContent = `Regex Error: ${error}`;
      regexStatus.className = 'regex-feedback error';
    } else {
      regexStatus.textContent = state.searchPattern ? 'Pattern valid' : '';
      regexStatus.className = 'regex-feedback';
    }
  }

  const filtered = filterRecordsByRegex(state.records, regex);
  const sorted = getSortedRecords(filtered);

  renderRecordsTable(sorted, regex, state.currentCurrency);
  renderDashboardStats(state.records, state.monthlyCap, state.currentCurrency);
}

function setupNavigation() {
  const navButtons = document.querySelectorAll('.nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      navButtons.forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });
}

function setupForm() {
  const form = document.getElementById('record-form');
  const cancelBtn = document.getElementById('form-cancel-btn');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('record-id');
    const descInput = document.getElementById('form-desc');
    const amountInput = document.getElementById('form-amount');
    const catInput = document.getElementById('form-category');
    const dateInput = document.getElementById('form-date');

    const candidate = {
      description: descInput.value,
      amount: parseFloat(amountInput.value) || 0,
      category: catInput.value,
      date: dateInput.value
    };

    const { isValid, errors } = validateRecord(candidate);

    // Clear previous inline errors
    ['desc-error', 'amount-error', 'category-error', 'date-error'].forEach(id => {
      document.getElementById(id).textContent = '';
    });

    if (!isValid) {
      if (errors.description) document.getElementById('desc-error').textContent = errors.description;
      if (errors.amount) document.getElementById('amount-error').textContent = errors.amount;
      if (errors.category) document.getElementById('category-error').textContent = errors.category;
      if (errors.date) document.getElementById('date-error').textContent = errors.date;
      announceLive('Form submission contains validation errors.', true);
      return;
    }

    if (state.editingId) {
      updateRecord(state.editingId, candidate);
      announceLive(`Transaction updated successfully.`);
      state.editingId = null;
    } else {
      const newRecord = {
        id: `rec_${Date.now()}`,
        ...candidate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addRecord(newRecord);
      announceLive(`Transaction added successfully.`);
    }

    saveRecords(state.records);
    form.reset();
    idInput.value = '';
    document.getElementById('form-submit-btn').textContent = 'Save Transaction';
    refreshUI();
  });

  cancelBtn.addEventListener('click', () => {
    form.reset();
    state.editingId = null;
    document.getElementById('record-id').value = '';
    document.getElementById('form-submit-btn').textContent = 'Save Transaction';
  });

  // Table row actions (Edit / Delete) via event delegation
  const tbody = document.getElementById('records-table-body');
  tbody.addEventListener('click', (e) => {
    const editBtn = e.target.closest('.btn-edit');
    const deleteBtn = e.target.closest('.btn-delete');

    if (editBtn) {
      const id = editBtn.dataset.id;
      const rec = state.records.find(r => r.id === id);
      if (rec) {
        state.editingId = id;
        document.getElementById('record-id').value = rec.id;
        document.getElementById('form-desc').value = rec.description;
        document.getElementById('form-amount').value = rec.amount;
        document.getElementById('form-category').value = rec.category;
        document.getElementById('form-date').value = rec.date;
        document.getElementById('form-submit-btn').textContent = 'Update Transaction';
        window.location.hash = '#add-record';
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      if (confirm('Are you sure you want to delete this record?')) {
        deleteRecord(id);
        saveRecords(state.records);
        refreshUI();
        announceLive('Transaction deleted.');
      }
    }
  });
}

function setupSearchAndSort() {
  const searchInput = document.getElementById('search-input');
  const caseToggle = document.getElementById('case-sensitive-toggle');

  searchInput.addEventListener('input', (e) => {
    state.searchPattern = e.target.value;
    refreshUI();
  });

  caseToggle.addEventListener('change', (e) => {
    state.caseSensitive = e.target.checked;
    refreshUI();
  });

  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const field = e.currentTarget.dataset.sort;
      toggleSort(field);
      refreshUI();
    });
  });
}

function setupSettings() {
  const capBtn = document.getElementById('btn-save-cap');
  const capInput = document.getElementById('settings-cap');
  const currencySelect = document.getElementById('currency-select');
  const exportBtn = document.getElementById('btn-export-json');
  const importInput = document.getElementById('import-json-input');
  const importStatus = document.getElementById('import-status');

  capBtn.addEventListener('click', () => {
    state.monthlyCap = parseFloat(capInput.value) || 500.00;
    savePreferences(state.monthlyCap, state.currentCurrency);
    refreshUI();
    announceLive('Monthly spending cap updated.');
  });

  currencySelect.addEventListener('change', (e) => {
    state.currentCurrency = e.target.value;
    savePreferences(state.monthlyCap, state.currentCurrency);
    refreshUI();
  });

  exportBtn.addEventListener('click', () => {
    exportToJSON(state.records);
  });

  importInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (validateImportedJSON(json)) {
          setRecords(json);
          saveRecords(state.records);
          refreshUI();
          importStatus.textContent = 'Import successful!';
          importStatus.style.color = 'var(--success)';
        } else {
          importStatus.textContent = 'Invalid JSON data schema.';
          importStatus.style.color = 'var(--danger)';
        }
      } catch (err) {
        importStatus.textContent = 'Malformed JSON file.';
        importStatus.style.color = 'var(--danger)';
      }
    };
    reader.readAsText(file);
  });
}

// Bootstrap
window.addEventListener('DOMContentLoaded', init);