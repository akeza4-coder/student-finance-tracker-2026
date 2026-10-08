# Student Pocket Finance Tracker

An accessible, responsive vanilla web application built for university students to track campus expenses, monitor monthly spending caps with live feedback, and search records using regular expressions.

## Live Deployment & Repository
- **GitHub Pages URL:** https://akeza4-coder.github.io/student-finance-tracker-2026/
- **Repository URL:** https://github.com/akeza4-coder/student-finance-tracker-2026
- **Test Suite:** https://akeza4-coder.github.io/student-finance-tracker-2026/tests.html
- **Demo Video (Unlisted):** [Add your unlisted YouTube/Loom link here]

---

## Features
- **Semantic Structure & Landmarks:** Built using `<header>`, `<nav>`, `<main>`, `<section>`, and `<footer>` with a strict heading hierarchy.
- **Mobile-First Responsive Design:** Adapts smoothly across mobile (360px+), tablet (768px+), and desktop (1024px+) layouts without external CSS frameworks.
- **Dynamic Stats Dashboard:** Live calculation of total transactions, total expenses, most frequent category, and a responsive CSS 7-day spending trend chart.
- **Spending Cap & ARIA Live Alerts:** Real-time feedback via polite announcements when within budget and assertive alerts when the cap is exceeded.
- **Currency Conversion:** Base currency USD with support for RWF (1:1,400) and EUR (1:0.92) using manual conversion rates.
- **Data Persistence & Backups:** Automatic syncing with `localStorage` and JSON export/import with strict schema validation.
- **Full Keyboard Navigation:** Complete accessibility with visible focus outlines and a skip-to-content shortcut.

---

## Regex Catalog

| Field / Feature | Regular Expression Pattern | Description & Behavior | Example Match |
| :--- | :--- | :--- | :--- |
| **Description** | `/^\S(?:.*\S)?$/` | Disallows leading and trailing whitespace while allowing internal spaces. | `"Lunch at cafeteria"` |
| **Amount** | `/^(0\|[1-9]\d*)(\.\d{1,2})?$/` | Enforces positive numbers with up to 2 decimal places. | `"12.50"` |
| **Date** | `/^\d{4}-(0[1-9]\|1[0-2])-(0[1-9]\|[12]\d\|3[01])$/` | Enforces strict ISO `YYYY-MM-DD` formatting. | `"2026-10-08"` |
| **Category** | `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/` | Restricts input to letters with single internal hyphens or spaces. | `"Part-time"` |
| **Advanced Pattern** | `/\b(\w+)\s+\1\b/i` | Uses a back-reference (`\1`) to catch accidental duplicate words. | Rejects `"coffee coffee"` |
| **Safe Live Search** | `new RegExp(pattern, flags)` | Wrapped in `try/catch` to highlight matching text inside `<mark>` tags. | `(coffee\|tea)` |

---

## Keyboard Navigation Map
- **Tab / Shift + Tab:** Navigate forward and backward through interactive elements.
- **Enter / Space:** Activate navigation tabs, sort buttons, and submit forms.
- **Skip Link:** Hit `Tab` immediately on page load to jump straight to `#main-content`.

---

## Accessibility (a11y) Notes
- Complies with WCAG contrast ratios.
- Visible focus rings styled with `:focus-visible` (`3px solid #f59e0b`).
- Dynamic notifications dispatched via ARIA live regions (`#live-region-status` and `#live-region-alert`).
- Form controls explicitly bound to `<label>` elements via `for` and `id` attributes.

---

## Running the Unit Tests
Open `tests.html` in any modern web browser or visit the live test URL on GitHub Pages. The test suite automatically runs 12 assertion checks against `scripts/validators.js` and renders a green PASS badge for each test case.