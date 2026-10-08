/**
 * scripts/ui.js
 */

import { highlightText } from './search.js';
import { CURRENCY_RATES } from './state.js';

export function announceLive(message, isAlert = false) {
  const targetId = isAlert ? 'live-region-alert' : 'live-region-status';
  const el = document.getElementById(targetId);
  if (el) el.textContent = message;
}

export function formatCurrency(amount, currencyCode = 'RWF') {
  const { symbol, rate } = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.RWF;
  const converted = Math.round(Number(amount) * rate);
  return `${converted.toLocaleString()}`;
}

export function renderRecordsTable(records, compiledRegex, activeCurrency) {
  const tbody = document.getElementById('records-table-body');
  if (!tbody) return;

  if (records.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">
          No transactions found.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = records.map(r => `
    <tr data-id="${r.id}">
      <td>${highlightText(r.date, compiledRegex)}</td>
      <td><strong>${highlightText(r.description, compiledRegex)}</strong></td>
      <td>${highlightText(r.category, compiledRegex)}</td>
      <td>${formatCurrency(r.amount, activeCurrency)}</td>
      <td class="row-options">
        <button type="button" class="btn-opt-edit" data-id="${r.id}" aria-label="Edit ${r.description}">Edit</button>
        <button type="button" class="btn-opt-delete" data-id="${r.id}" aria-label="Delete ${r.description}">Delete</button>
      </td>
    </tr>
  `).join('');
}

export function renderDashboardStats(records, monthlyCap, activeCurrency) {
  const totalCountEl = document.getElementById('stat-total-records');
  const totalAmountEl = document.getElementById('stat-total-amount');
  const topCategoryEl = document.getElementById('stat-top-category');
  const capStatusEl = document.getElementById('stat-cap-status');

  const totalCount = records.length;
  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0);

  // Highest category
  const categoryCosts = {};
  records.forEach(r => {
    categoryCosts[r.category] = (categoryCosts[r.category] || 0) + Number(r.amount);
  });
  let highestCategory = 'None';
  let maxCost = 0;
  for (const [cat, cost] of Object.entries(categoryCosts)) {
    if (cost > maxCost) {
      maxCost = cost;
      highestCategory = cat;
    }
  }

  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount, activeCurrency);
  if (topCategoryEl) topCategoryEl.textContent = highestCategory;

  if (capStatusEl) {
    capStatusEl.textContent = `${formatCurrency(totalAmount, activeCurrency)} / ${formatCurrency(monthlyCap, activeCurrency)} FRW`;
  }
}