# TaskFlow — Executive Task & Dynamic Urgency Planner

A complete, professional web application designed to help you organize daily tasks, manage checklists/subtasks, track recurring routines, dynamically prioritize work by deadline urgency, report issues, and prioritize feature suggestions.

---

## 🌟 What's New & Included

### 1. 🌙 Upgraded Obsidian Dark Mode
- **Native `color-scheme: dark`**: Browser-native calendar dropdowns, scrollbars, and time pickers automatically match dark mode.
- **Layered Obsidian Surfaces**: Physical elevation tiers (`#080c15` base, `#0f172a` surfaces, `#131c31` cards with subtle 1px top-edge highlights).
- **Ambient Urgency Glows**: Soft luminescent glows for Overdue 🚨 (crimson aura) and Critical 🔥 (amber aura) items.
- **Glowing Checkbox Bloom**: Subtle emerald bloom on completing tasks.
- **Reduced Halation**: Tuned off-white typography (`#f1f5f9` / `#94a3b8`) for zero eye strain during night sessions.
- **Smooth 220ms Cross-Fade**: Seamless transitions when toggling themes.

### 2. 👤 Mandatory Account Creation & Per-User Task Isolation
- **Authentication Gate / Lock Screen:** When opening TaskFlow without being logged in, users cannot see or create tasks. A dedicated welcome screen prompts them to first **Create an Account** or **Log In** with their Email and Password.
- **"Remember Me" Option:** Users can check "Remember Me" to persist their session across browser restarts (`localStorage`). If left unchecked, closing the browser window/tab immediately logs out the session (`sessionStorage`), requiring password re-entry on next visit.
- **Strict Task Privacy & Isolation:** Tasks are linked strictly to the authenticated account (`taskflow_tasks_<email>`). Each account sees only their own daily pending tasks, completed history, and dynamic urgency schedules.
- **Protected Actions:** New task creation, subtask checklists, and backup management are completely locked until authentication.
- **Instant One-Click Sign Out:** Clicking Sign Out clears memory, locks the task dashboard, and returns to the welcome gate.

### 3. 🎧 Support & Help Page (Direct Email to harshjhahjh2008@gmail.com)
- Clean, focused interface asking simply: **"What is your problem?"**
- Multi-line description box with optional sender email field for replies.
- The **Send** button automatically launches a pre-formatted email draft directed to **harshjhahjh2008@gmail.com** and logs the issue locally.
- Instant on-screen confirmation banner confirms submission.

### 4. 🔒 Comprehensive Industry-Standard Privacy Policy
- Modeled after leading enterprise privacy policies (Notion, Google, Linear).
- 9 exhaustive sections covering collection minimization, 100% offline-first local storage architecture, zero data selling, zero tracking pixels, data portability (JSON export/import), right to erasure, and contact at **harshjhahjh2008@gmail.com**.

### 5. 💡 How to Improve TaskFlow (Minimal Idea Bar)
- Positioned directly below the blue banner **"How to improve TaskFlow"**.
- Single clean input bar where users write their thoughts, ideas, or suggestions.
- Upon clicking **Send Suggestion**, users see exclusively: **"Thank you for the suggestion"** with a quick option to write another. All complex matrices removed as requested!

### 6. ✨ Smooth Stagger Animations & Focus Stream Banner
- Smooth `animate-flow-in` fade-in-up animations that eliminate any odd gaps or visual jumps where tiles were previously removed.
- Elegant **Priority Stream Status Banner** showing live auto-sort status and quick task creation.

---

## 🖥️ How to Run

Double-click **[`Launch TaskFlow.bat`](file:///C:/Users/chron/.gemini/antigravity/scratch/task-manager-pro/Launch%20TaskFlow.bat)** or open **[`index.html`](file:///C:/Users/chron/.gemini/antigravity/scratch/task-manager-pro/index.html)** in any browser (Chrome, Edge, Firefox).
