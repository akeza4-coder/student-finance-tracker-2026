/**
 * scripts/app.js
 */

import { state, setRecords, addRecord, updateRecord, deleteRecord, getSortedRecords } from './state.js';
import { loadRecords, saveRecords, loadPreferences, savePreferences, exportToJSON, validateImportedJSON } from './storage.js';
import { compileRegex, filterRecordsByRegex } from './search.js';
import { validateRecord } from './validators.js';
import { renderRecordsTable, renderDashboardStats, announceLive } from './ui.js';

// Safe fallback records in case seed.json cannot be fetched
const FALLBACK_SEED = [
  { id: 'rec_0001', description: 'campus meal', amount: 2000, category: 'Food', date: '2026-10-02', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rec_0002', description: 'bus transport', amount: 10000, category: 'Transport', date: '2026-10-04', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
  { id: 'rec_0003', description: 'notebook paper', amount: 1500, category: 'Books', date: '2026-10-05', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
];

async function init() {
  let initialData = FALLBACK_SEED;

  try {
    const res = await fetch('seed.json');
    if (res.ok) {
      initialData = await res.json();
    }
  } catch (err) {
    console.warn('Using default fallback records:', err);
  }

  const loaded = loadRecords(initialData);
  setRecords(loaded.length > 0 ? loaded : FALLBACK_SEED);

  const { cap, currency } = loadPreferences();
  state.monthlyCap = cap || 50000;
  state.currentCurrency = currency || 'RWF';

  setupSidebarNav();
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
      regexStatus.textContent = state.searchPattern ? 'Pattern active' : '';
      regexStatus.className = 'regex-feedback';
    }
  }

  const filtered = filterRecordsByRegex(state.records, regex);
  const sorted = getSortedRecords(filtered);

  renderRecordsTable(sorted, regex, state.currentCurrency);
  renderDashboardStats(state.records, state.monthlyCap, state.currentCurrency);
}

function setupSidebarNav() {
  const navButtons = document.querySelectorAll('.sidebar-nav .nav-btn');
  navButtons.forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      navButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const targetView = btn.dataset.view;
      document.querySelectorAll('.view-panel').forEach(panel => {
        panel.classList.remove('active');
      });

      const activePanel = document.getElementById(`view-${targetView}`);
      if (activePanel) {
        activePanel.classList.add('active');
      }
    });
  });
}

function setupForm() {
  const form = document.getElementById('record-form');
  const cancelBtn = document.getElementById('form-cancel-btn');

  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const idInput = document.getElementById('record-id');
    const descInput = document.getElementById('form-desc');
    const amountInput = document.getElementById('form-amount');
    const catInput = document.getElementById('form-category');
    const dateInput = document.getElementById('form-date');

    const candidate = {
      description: descInput.value.trim(),
      amount: parseFloat(amountInput.value) || 0,
      category: catInput.value.trim(),
      date: dateInput.value
    };

    const { isValid, errors } = validateRecord(candidate);

    ['desc-error', 'amount-error', 'category-error', 'date-error'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = '';
    });

    if (!isValid) {
      if (errors.description) document.getElementById('desc-error').textContent = errors.description;
      if (errors.amount) document.getElementById('amount-error').textContent = errors.amount;
      if (errors.category) document.getElementById('category-error').textContent = errors.category;
      if (errors.date) document.getElementById('date-error').textContent = errors.date;
      return;
    }

    if (state.editingId) {
      updateRecord(state.editingId, candidate);
      state.editingId = null;
      announceLive('Expense updated.');
    } else {
      const newRecord = {
        id: `rec_${Date.now()}`,
        ...candidate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      addRecord(newRecord);
      announceLive('Expense added.');
    }

    saveRecords(state.records);
    form.reset();
    if (idInput) idInput.value = '';
    
    const submitBtn = document.getElementById('form-submit-btn');
    if (submitBtn) submitBtn.textContent = 'Save Expense';

    // Switch view back to history list
    const historyBtn = document.querySelector('[data-view="records"]');
    if (historyBtn) historyBtn.click();

    refreshUI();
  });

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      form.reset();
      state.editingId = null;
      const idInput = document.getElementById('record-id');
      if (idInput) idInput.value = '';
      const submitBtn = document.getElementById('form-submit-btn');
      if (submitBtn) submitBtn.textContent = 'Save Expense';
      const historyBtn = document.querySelector('[data-view="records"]');
      if (historyBtn) historyBtn.click();
    });
  }

  // Row Edit / Delete delegation
  const tbody = document.getElementById('records-table-body');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-opt-edit');
      const deleteBtn = e.target.closest('.btn-opt-delete');

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
          document.getElementById('form-submit-btn').textContent = 'Update Expense';
          
          const addViewBtn = document.querySelector('[data-view="add-record"]');
          if (addViewBtn) addViewBtn.click();
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (confirm('Are you sure you want to delete this expense?')) {
          deleteRecord(id);
          saveRecords(state.records);
          refreshUI();
          announceLive('Expense deleted.');
        }
      }
    });
  }
}

function setupSearchAndSort() {
  const searchInput = document.getElementById('search-input');
  const resetBtn = document.getElementById('btn-reset-search');
  const caseToggle = document.getElementById('case-sensitive-toggle');
  const sortFieldSelect = document.getElementById('sort-field-select');
  const sortDirSelect = document.getElementById('sort-dir-select');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      state.searchPattern = e.target.value;
      refreshUI();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      state.searchPattern = '';
      refreshUI();
    });
  }

  if (caseToggle) {
    caseToggle.addEventListener('change', (e) => {
      state.caseSensitive = e.target.checked;
      refreshUI();
    });
  }

  if (sortFieldSelect) {
    sortFieldSelect.addEventListener('change', (e) => {
      state.sortField = e.target.value;
      refreshUI();
    });
  }

  if (sortDirSelect) {
    sortDirSelect.addEventListener('change', (e) => {
      state.sortDirection = e.target.value;
      refreshUI();
    });
  }
}

function setupSettings() {
  const capBtn = document.getElementById('btn-save-cap');
  const capInput = document.getElementById('settings-cap');
  const currencySelect = document.getElementById('currency-select');
  const exportBtn = document.getElementById('btn-export-json');
  const importInput = document.getElementById('import-json-input');
  const importStatus = document.getElementById('import-status');

  if (capBtn && capInput) {
    capBtn.addEventListener('click', () => {
      state.monthlyCap = parseFloat(capInput.value) || 50000;
      savePreferences(state.monthlyCap, state.currentCurrency);
      refreshUI();
      announceLive('Spending cap updated.');
    });
  }

  if (currencySelect) {
    currencySelect.addEventListener('change', (e) => {
      state.currentCurrency = e.target.value;
      savePreferences(state.monthlyCap, state.currentCurrency);
      refreshUI();
    });
  }

  if (exportBtn) {
    exportBtn.addEventListener('click', () => exportToJSON(state.records));
  }

  if (importInput) {
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
            if (importStatus) {
              importStatus.textContent = 'Import successful!';
              importStatus.style.color = '#34d399';
            }
          } else if (importStatus) {
            importStatus.textContent = 'Invalid JSON structure.';
            importStatus.style.color = '#fb7185';
          }
        } catch {
          if (importStatus) {
            importStatus.textContent = 'Malformed JSON file.';
            importStatus.style.color = '#fb7185';
          }
        }
      };
      reader.readAsText(file);
    });
  }
}

window.addEventListener('DOMContentLoaded', init);