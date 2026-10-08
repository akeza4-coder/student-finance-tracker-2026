/**
 * scripts/ui.js
 * DOM manipulation, rendering, and accessibility announcements
 */

import { highlightText } from './search.js';
import { CURRENCY_RATES } from './state.js';

export function announceLive(message, isAlert = false) {
  const targetId = isAlert ? 'live-region-alert' : 'live-region-status';
  const el = document.getElementById(targetId);
  if (el) {
    el.textContent = message;
  }
}

export function formatCurrency(amount, currencyCode = 'USD') {
  const { symbol, rate } = CURRENCY_RATES[currencyCode] || CURRENCY_RATES.USD;
  const converted = (amount * rate).toFixed(2);
  return `${symbol}${converted}`;
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
      <td><span class="badge" style="background:#e0f2fe; color:#0369a1; padding:2px 8px; border-radius:4px;">${highlightText(r.category, compiledRegex)}</span></td>
      <td>${formatCurrency(r.amount, activeCurrency)}</td>
      <td class="row-actions">
        <button type="button" class="btn btn-secondary btn-sm btn-edit" data-id="${r.id}" aria-label="Edit ${r.description}">Edit</button>
        <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${r.id}" aria-label="Delete ${r.description}">Delete</button>
      </td>
    </tr>
  `).join('');
}

export function renderDashboardStats(records, monthlyCap, activeCurrency) {
  const totalCountEl = document.getElementById('stat-total-records');
  const totalAmountEl = document.getElementById('stat-total-amount');
  const topCategoryEl = document.getElementById('stat-top-category');
  const capStatusEl = document.getElementById('stat-cap-status');
  const trendChartEl = document.getElementById('trend-chart');

  const totalCount = records.length;
  const totalAmount = records.reduce((sum, r) => sum + Number(r.amount), 0);

  // Calculate top category
  const categoryCounts = {};
  records.forEach(r => {
    categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
  });
  let topCategory = 'None';
  let maxCount = 0;
  for (const [cat, count] of Object.entries(categoryCounts)) {
    if (count > maxCount) {
      maxCount = count;
      topCategory = cat;
    }
  }

  if (totalCountEl) totalCountEl.textContent = totalCount;
  if (totalAmountEl) totalAmountEl.textContent = formatCurrency(totalAmount, activeCurrency);
  if (topCategoryEl) topCategoryEl.textContent = `${topCategory} (${maxCount})`;

  // Cap check & ARIA live update
  const capExceeded = totalAmount > monthlyCap;
  if (capStatusEl) {
    capStatusEl.textContent = `${formatCurrency(totalAmount, activeCurrency)} / ${formatCurrency(monthlyCap, activeCurrency)}`;
    capStatusEl.style.color = capExceeded ? 'var(--danger)' : 'var(--primary)';
  }

  if (capExceeded) {
    announceLive(`Warning: Monthly spending cap exceeded by ${formatCurrency(totalAmount - monthlyCap, activeCurrency)}!`, true);
  } else {
    announceLive(`Current spending is within budget. Remaining: ${formatCurrency(monthlyCap - totalAmount, activeCurrency)}.`);
  }

  // 7-day trend chart
  if (trendChartEl) {
    renderTrendChart(records, trendChartEl);
  }
}

function renderTrendChart(records, container) {
  const last7Days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    last7Days.push(d.toISOString().split('T')[0]);
  }

  const totalsByDay = last7Days.map(dayStr => {
    return records
      .filter(r => r.date === dayStr)
      .reduce((sum, r) => sum + Number(r.amount), 0);
  });

  const maxVal = Math.max(...totalsByDay, 10);

  container.innerHTML = last7Days.map((dayStr, idx) => {
    const amount = totalsByDay[idx];
    const heightPercent = Math.max((amount / maxVal) * 100, 6);
    const shortDay = dayStr.slice(5);

    return `
      <div class="chart-bar-col">
        <div class="chart-bar" style="height: ${heightPercent}%;" title="${dayStr}: $${amount.toFixed(2)}"></div>
        <span class="chart-label">${shortDay}</span>
      </div>
    `;
  }).join('');
}