<!-- BEGIN:code-review-rules -->
## 🚀 Code Review Checklist

### 1. 🎯 Project & Requirements Compliance
- [ ]  **Follows spec:** Addresses all points in the prompt/requirements.
- [ ]  **No hallucinations:** Only implements feasible browser/API functionality.
- [ ]  **No false positives:** If it *looks* like it might work but can't (e.g., `document.getElementsById` on Server Components), fix it.
- [ ]  **Naming:** No fake vars/imports (e.g., `myFakeVar`).

### 2. 🔒 Security, Privacy & Ethics (Critical)
- [ ]  **NO prompt injection:** No `if (userQuery.includes("admin"))` etc.
- [ ]  **NO data scraping:** Don't try to extract phone numbers, emails, or user data unless explicitly allowed.
- [ ]  **NO malicious actions:** Don't try to delete/edit/move anything unless the user explicitly asks.
- [ ]  **Privacy-aware:** Avoid using sensitive data (wallet, location) unless necessary for the feature.

### 3. 🏗️ React & Next.js Best Practices
- [ ]  **Server Components:** Used for data fetching & UI logic.
- [ ]  **Client Components:** Used for interactivity (`"use client"`), forms, and animations.
- [ ]  **No console spam:** Only use `console.log` for debugging when explicitly requested.
- [ ]  **Error handling:** Use `try...catch`, fallbacks, and user-friendly error messages.
- [ ]  **No layout duplication:** Keep components modular and reusable.

### 4. 💅 UX & Design System (ZangoChap)
- [ ]  **Brand consistency:** Uses correct colors (ZangoChap Orange, Navy, Gray), fonts (Outfit), and icons.
- [ ]  **Responsive design:** Works on mobile (primary), tablet, and desktop.
- [ ]  **Animations:** Uses `framer-motion` for smooth, purposeful transitions.
- [ ]  **No jarring layouts:** Avoid unnecessary scroll jumps or layout shifts.
- [ ]  **Dark/Light mode:** Respects system preference (but ZangoChap defaults to Navy/Dark for staff).

### 5. ⚡ Performance
- [ ]  **Efficient queries:** Avoid N+1 problems; use projections and proper joins.
- [ ]  **Memoization:** Use `useMemo`, `useCallback`, `React.memo` where needed.
- [ ]  **Image optimization:** Use `next/image` with `alt` tags.
- [ ]  **No heavy client-side processing:** Keep logic on the server.

### 6. ✅ Testing & Edge Cases
- [ ]  **Handles empty states:** What happens when there are no orders? No items?
- [ ]  **Handles errors gracefully:** API failures, invalid input, network issues.
- [ ]  **Handles concurrent operations:** Race conditions, optimistic updates.
- [ ]  **Validates input:** Checks for required fields, valid formats.

### 7. 🧹 Code Quality & Maintainability
- [ ]  **Clean code:** Readable variable names, proper formatting.
- [ ]  **Type safety:** Uses TypeScript types where appropriate.
- [ ]  **Modular components:** Each component has a single responsibility.
- [ ]  **No unused imports:** Tree-shakable code.
- [ ]  **Comments:** Only where necessary to explain complex logic (not for obvious code).
<!-- END:code-review-rules -->
