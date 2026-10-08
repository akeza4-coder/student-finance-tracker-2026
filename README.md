# Student Pocket Finance Tracker

An accessible, responsive vanilla web application designed for university students to track living expenses, manage monthly budget caps, and search transactions via regular expressions.

## Live Deployment
- **GitHub Pages:** *[Will be added upon deployment]*
- **Demo Video:** *[Will be added upon recording]*

## Architecture & Data Model
- **HTML5:** Semantic landmarks (`header`, `nav`, `main`, `section`, `footer`) and ARIA live regions.
- **CSS3:** Mobile-first layout without external frameworks (breakpoints: 360px, 768px, 1024px).
- **JavaScript (ES Modules):** Modular state management, validation, search compilation, and localStorage sync.

### Record Schema
```json
{
  "id": "rec_0001",
  "description": "Lunch at cafeteria",
  "amount": 12.50,
  "category": "Food",
  "date": "2026-10-02",
  "createdAt": "2026-10-02T12:30:00.000Z",
  "updatedAt": "2026-10-02T12:30:00.000Z"
}