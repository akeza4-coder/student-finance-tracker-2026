// STUDENT POCKET MONEY TRACKER - CORE ENGINE

const DEFAULT_SEED = [
  { id: 'rec_1', description: 'Campus Lunch Meal', amount: 2500, category: 'Food', date: '2026-10-02' },
  { id: 'rec_2', description: 'City bus pass transit', amount: 10000, category: 'Transport', date: '2026-10-04' },
  { id: 'rec_3', description: 'Notebook paper refill', amount: 1500, category: 'Books', date: '2026-10-05' }
];

const CATEGORIES = ['Food', 'Transport', 'Books', 'Housing', 'Entertainment', 'Fees', 'Other'];

let records = [];
let editingId = null;
let currentCap = 50000;
let searchKeyword = '';
let sortField = 'date';
let sortDirection = 'desc';

// --- STORAGE ---
function loadData() {
  try {
    const raw = localStorage.getItem('fintrack_records');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.warn('Storage read error:', e);
  }
  return [...DEFAULT_SEED];
}

function saveData(data) {
  try {
    localStorage.setItem('fintrack_records', JSON.stringify(data));
  } catch (e) {
    console.error('Storage save error:', e);
  }
}

// --- VALIDATION (Regex Rubric Compliant) ---
const REGEX_PATTERNS = {
  description: /^\S(?:.*\S)?$/,
  amount: /^(0|[1-9]\d*)(\.\d{1,2})?$/,
  date: /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/,
  duplicateWords: /\b(\w+)\s+\1\b/i
};

function validate(candidate) {
  const errors = {};

  if (!candidate.description) {
    errors.description = 'Please enter an item description.';
  } else if (!REGEX_PATTERNS.description.test(candidate.description)) {
    errors.description = 'No leading or trailing spaces allowed.';
  } else if (REGEX_PATTERNS.duplicateWords.test(candidate.description)) {
    errors.description = 'Accidental repeated words detected (e.g., "coffee coffee").';
  }

  const amtStr = String(candidate.amount);
  if (!amtStr || isNaN(candidate.amount) || candidate.amount <= 0) {
    errors.amount = 'Please enter a valid positive number.';
  } else if (!REGEX_PATTERNS.amount.test(amtStr)) {
    errors.amount = 'Invalid format (up to 2 decimals allowed).';
  }

  if (!candidate.date || !REGEX_PATTERNS.date.test(candidate.date)) {
    errors.date = 'Please pick a valid date (YYYY-MM-DD).';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}

// --- RENDER FUNCTIONS ---
function renderUI() {
  renderTable();
  renderStats();
}

function renderTable() {
  const tbody = document.getElementById('ledger-rows-target');
  if (!tbody) return;

  let filtered = [...records];

  // Regex Search
  if (searchKeyword.trim()) {
    try {
      const re = new RegExp(searchKeyword, 'gi');
      filtered = filtered.filter(r => 
        re.test(r.description) || re.test(r.category) || re.test(String(r.amount))
      );
    } catch (e) {
      // If user is half-typing an invalid regex, fallback to plain text search
      filtered = filtered.filter(r =>
        r.description.toLowerCase().includes(searchKeyword.toLowerCase()) ||
        r.category.toLowerCase().includes(searchKeyword.toLowerCase())
      );
    }
  }

  // Sorting
  const dir = sortDirection === 'asc' ? 1 : -1;
  filtered.sort((a, b) => {
    if (sortField === 'amount') return (Number(a.amount) - Number(b.amount)) * dir;
    if (sortField === 'date') return (new Date(a.date) - new Date(b.date)) * dir;
    return String(a.description).localeCompare(String(b.description)) * dir;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 2rem; color: #8e8e99;">No expenses found.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    let descDisplay = item.description;
    if (searchKeyword.trim()) {
      try {
        const re = new RegExp(`(${searchKeyword})`, 'gi');
        descDisplay = descDisplay.replace(re, '<mark>$1</mark>');
      } catch (e) {}
    }

    return `
      <tr data-id="${item.id}">
        <td>${item.date}</td>
        <td><strong>${descDisplay}</strong></td>
        <td><span style="background: rgba(255,255,255,0.06); padding: 3px 8px; border-radius: 4px;">${item.category}</span></td>
        <td>${Number(item.amount).toLocaleString()}</td>
        <td>
          <button type="button" class="btn btn-secondary btn-sm btn-edit" data-id="${item.id}" style="padding: 4px 10px; font-size: 0.8rem; margin-right: 5px; cursor: pointer;">Edit</button>
          <button type="button" class="btn btn-primary btn-sm btn-delete" data-id="${item.id}" style="padding: 4px 10px; font-size: 0.8rem; cursor: pointer;">Delete</button>
        </td>
      </tr>
    `;
  }).join('');
}

function renderStats() {
  const countEl = document.getElementById('stat-total-count');
  const amountEl = document.getElementById('stat-total-amount');
  const topCatEl = document.getElementById('stat-top-category');
  const remainingEl = document.getElementById('cap-remaining-display');
  const limitEl = document.getElementById('cap-limit-display');
  const capFeedback = document.getElementById('cap-live-feedback');

  const count = records.length;
  const total = records.reduce((acc, cur) => acc + Number(cur.amount), 0);

  if (countEl) countEl.textContent = count;
  if (amountEl) amountEl.textContent = total.toLocaleString();

  // Find category with biggest cost
  const categoryTotals = {};
  records.forEach(r => {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + Number(r.amount);
  });
  let maxCat = '—';
  let maxAmount = 0;
  for (const [cat, amt] of Object.entries(categoryTotals)) {
    if (amt > maxAmount) {
      maxAmount = amt;
      maxCat = cat;
    }
  }
  if (topCatEl) topCatEl.textContent = maxCat;

  if (limitEl) limitEl.textContent = `${currentCap.toLocaleString()} Frw`;
  if (remainingEl) {
    const left = currentCap - total;
    remainingEl.textContent = `${left.toLocaleString()} Frw`;
  }

  if (capFeedback) {
    if (total > currentCap) {
      capFeedback.textContent = `Warning: Over budget by ${(total - currentCap).toLocaleString()} Frw!`;
      capFeedback.style.color = '#fb7185';
    } else {
      capFeedback.textContent = `Within budget safe zone.`;
      capFeedback.style.color = '#34d399';
    }
  }
}

// --- SWITCH SECTIONS ---
function navigateTo(targetId) {
  document.querySelectorAll('.app-section').forEach(sec => sec.classList.remove('active-view'));
  document.querySelectorAll('.nav-links .nav-link').forEach(l => l.classList.remove('active'));

  const sec = document.getElementById(targetId);
  if (sec) sec.classList.add('active-view');

  const link = document.querySelector(`.nav-links a[href="#${targetId}"]`);
  if (link) link.classList.add('active');
}

// --- INITIALIZE APPLICATION ---
window.addEventListener('DOMContentLoaded', () => {
  records = loadData();

  // Populate categories select
  const catSelect = document.getElementById('input-category');
  if (catSelect) {
    catSelect.innerHTML = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  // Set default today's date
  const dateInput = document.getElementById('input-date');
  if (dateInput && !dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  // Navigation Links
  document.querySelectorAll('.nav-links .nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.getAttribute('href').replace('#', '');
      navigateTo(target);
    });
  });

  // FORM SUBMIT HANDLER
  const form = document.getElementById('transaction-mutation-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const descInput = document.getElementById('input-description');
      const amtInput = document.getElementById('input-amount');
      const dateInp = document.getElementById('input-date');
      const catInp = document.getElementById('input-category');

      const candidate = {
        description: descInput.value.trim(),
        amount: parseFloat(amtInput.value),
        date: dateInp.value,
        category: catInp.value
      };

      const val = validate(candidate);

      // Display or clear errors
      const errDesc = document.getElementById('err-description');
      const errAmt = document.getElementById('err-amount');
      const errDate = document.getElementById('err-date');

      if (errDesc) errDesc.textContent = val.errors.description || '';
      if (errAmt) errAmt.textContent = val.errors.amount || '';
      if (errDate) errDate.textContent = val.errors.date || '';

      if (!val.isValid) {
        return; // Validation failed, do not add
      }

      if (editingId) {
        const index = records.findIndex(r => r.id === editingId);
        if (index !== -1) {
          records[index] = { ...records[index], ...candidate };
        }
        editingId = null;
        document.getElementById('form-submit-btn').textContent = 'Save Expense';
        const cancelBtn = document.getElementById('form-cancel-btn');
        if (cancelBtn) cancelBtn.style.display = 'none';
      } else {
        const newRecord = {
          id: 'rec_' + Date.now(),
          ...candidate
        };
        records.unshift(newRecord);
      }

      saveData(records);
      form.reset();
      dateInp.value = new Date().toISOString().split('T')[0];

      renderUI();
      navigateTo('records'); // Take user straight to the history table to see the added item!
    });
  }

  // Cancel Button
  const cancelBtn = document.getElementById('form-cancel-btn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      form.reset();
      editingId = null;
      document.getElementById('form-submit-btn').textContent = 'Save Expense';
      cancelBtn.style.display = 'none';
      navigateTo('records');
    });
  }

  // Table Edit / Delete Delegations
  const tbody = document.getElementById('ledger-rows-target');
  if (tbody) {
    tbody.addEventListener('click', (e) => {
      const editBtn = e.target.closest('.btn-edit');
      const delBtn = e.target.closest('.btn-delete');

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
          navigateTo('form-section');
        }
      }

      if (delBtn) {
        const id = delBtn.dataset.id;
        if (confirm('Delete this expense?')) {
          records = records.filter(r => r.id !== id);
          saveData(records);
          renderUI();
        }
      }
    });
  }

  // Search input & Reset
  const searchInput = document.getElementById('search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      searchKeyword = e.target.value;
      renderTable();
    });
  }

  const clearBtn = document.getElementById('clear-search-btn');
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      if (searchInput) searchInput.value = '';
      searchKeyword = '';
      renderTable();
    });
  }

  // Sorting selectors
  const sortSelect = document.getElementById('sort-selector');
  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      sortField = e.target.value;
      renderTable();
    });
  }

  const dirSelect = document.getElementById('sort-order-selector');
  if (dirSelect) {
    dirSelect.addEventListener('change', (e) => {
      sortDirection = e.target.value;
      renderTable();
    });
  }

  // Settings
  const saveSettingsBtn = document.getElementById('save-settings-btn');
  if (saveSettingsBtn) {
    saveSettingsBtn.addEventListener('click', () => {
      const capInp = document.getElementById('settings-budget-cap');
      if (capInp) {
        currentCap = parseFloat(capInp.value) || 50000;
        renderStats();
        alert('Budget limit updated to ' + currentCap.toLocaleString() + ' Frw');
      }
    });
  }

  // Initial View
  renderUI();
  navigateTo('dashboard');
});