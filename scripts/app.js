/**
 * scripts/app.js
 */

const categories = ['Food', 'Transport', 'Books', 'Housing', 'Entertainment', 'Fees', 'Other'];

const initialSeedData = [
  { id: 'rec_1', description: 'Campus Lunch Meal', amount: 2500, category: 'Food', date: '2026-10-02' },
  { id: 'rec_2', description: 'City bus pass transit', amount: 10000, category: 'Transport', date: '2026-10-04' },
  { id: 'rec_3', description: 'Notebook paper refill', amount: 1500, category: 'Books', date: '2026-10-05' }
];

let records = [];
let editingId = null;
let currentCap = 50000;
let activeSearch = '';

document.addEventListener('DOMContentLoaded', () => {
  // 1. Populate Category dropdown
  const catSelect = document.getElementById('input-category');
  if (catSelect) {
    catSelect.innerHTML = categories.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // 2. Set default date to today
  const dateInput = document.getElementById('input-date');
  if (dateInput) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // 3. Load records from storage or initial seed
  records = loadRecords(initialSeedData);
  const prefs = loadPreferences();
  currentCap = prefs.cap || 50000;

  // 4. Set up Navigation Switching (Fixes the black screen!)
  setupNavigation();

  // 5. Setup Form, Search, and Render
  setupForm();
  setupSearch();
  renderAll();
});

function setupNavigation() {
  const navLinks = document.querySelectorAll('.nav-links .nav-link');
  const sections = document.querySelectorAll('.app-section');

  function showSection(targetId) {
    sections.forEach(sec => sec.classList.remove('active-view'));
    navLinks.forEach(lnk => lnk.classList.remove('active'));

    const activeSec = document.getElementById(targetId);
    if (activeSec) {
      activeSec.classList.add('active-view');
    }

    const activeLnk = document.querySelector(`.nav-links a[href="#${targetId}"]`);
    if (activeLnk) {
      activeLnk.classList.add('active');
    }
  }

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').replace('#', '');
      showSection(targetId);
    });
  });

  // Default to Dashboard view
  showSection('dashboard');
}

function renderAll() {
  const { regex } = compileRegex(activeSearch);
  const filtered = filterRecordsByRegex(records, regex);

  renderRecordsTable(filtered, regex);
  renderDashboardStats(records, currentCap);
}

function setupSearch() {
  const searchInput = document.getElementById('search-input');
  const clearBtn = document.getElementById('clear-search-btn');

  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      activeSearch = e.target.value;
      renderAll();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      activeSearch = '';
      renderAll();
    });
  }
}

function setupForm() {
  const form = document.getElementById('transaction-mutation-form');
  const cancelBtn = document.getElementById('form-cancel-btn');

  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const descInput = document.getElementById('input-description');
      const amountInput = document.getElementById('input-amount');
      const dateInput = document.getElementById('input-date');
      const catInput = document.getElementById('input-category');

      const candidate = {
        description: descInput.value.trim(),
        amount: parseFloat(amountInput.value) || 0,
        date: dateInput.value,
        category: catInput.value
      };

      const val = validateRecord(candidate);

      document.getElementById('err-description').textContent = val.errors.description || '';
      document.getElementById('err-amount').textContent = val.errors.amount || '';
      document.getElementById('err-date').textContent = val.errors.date || '';

      if (!val.isValid) return;

      if (editingId) {
        const idx = records.findIndex(r => r.id === editingId);
        if (idx !== -1) records[idx] = { ...records[idx], ...candidate };
        editingId = null;
        document.getElementById('form-submit-btn').textContent = 'Save Expense';
        if (cancelBtn) cancelBtn.style.display = 'none';
      } else {
        records.unshift({
          id: `rec_${Date.now()}`,
          ...candidate
        });
      }

      saveRecords(records);
      form.reset();
      dateInput.value = new Date().toISOString().split('T')[0];

      renderAll();

      // Switch to History List so the user sees their new entry
      document.querySelector('a[href="#records"]').click();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      form.reset();
      editingId = null;
      document.getElementById('form-submit-btn').textContent = 'Save Expense';
      cancelBtn.style.display = 'none';
      document.querySelector('a[href="#records"]').click();
    });
  }

  // Row Edit / Delete clicks
  const tbody = document.getElementById('ledger-rows-target');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-opt-edit');
      const deleteBtn = e.target.closest('.btn-opt-delete');

      if (editBtn) {
        const id = editBtn.dataset.id;
        const item = records.find(r => r.id === id);
        if (item) {
          editingId = id;
          document.getElementById('input-description').value = item.description;
          document.getElementById('input-amount').value = item.amount;
          document.getElementById('input-date').value = item.date;
          document.getElementById('input-category').value = item.category;

          document.getElementById('form-submit-btn').textContent = 'Update Expense';
          if (cancelBtn) cancelBtn.style.display = 'inline-block';

          document.querySelector('a[href="#form-section"]').click();
        }
      }

      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        if (confirm('Are you sure you want to delete this expense?')) {
          records = records.filter(r => r.id !== id);
          saveRecords(records);
          renderAll();
        }
      }
    });
  }
}