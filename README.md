# 🚀 TaskFlow — Interactive To-Do List Application

TaskFlow is a production-ready, client-side task management application built to master advanced DOM manipulation, state-driven architecture, and local data persistence. It provides a seamless and accessible user experience combined with a highly responsive user interface.

---

## ✨ Key Features

### 🛠️ Full CRUD Functionality
- **Create:** Instantly add new tasks with dynamic state tracking.
- **Read:** Clear visual indicators for active and completed items.
- **Update:** Switch tasks into an inline edit mode using a modal popup, modifying descriptions and priority scales on the fly.
- **Delete:** Remove tasks safely accompanied by elegant fade-out exit animations.

### 💾 LocalStorage Persistence
- State changes automatically sync with `window.localStorage`. Your tasks, priority tags, and theme selection remain intact even after browser reloads.

### 🔍 Advanced Filtering & Sorting
- **Filtering:** Quickly isolate your objectives using **All**, **Active**, and **Completed** filter tabs.
- **Sorting:** Organize your workflow dynamically by **Newest**, **Oldest**, **Priority Level**, or **Alphabetical Order**.

### ⚡ Performance Optimization
- Implements high-performance **Event Delegation** on the master list element, ensuring minimal memory overhead and ultra-fast event handling.

### 🎨 Premium UI/UX Details
- **Toast Notifications:** Real-time feedback alerts (Success, Info, Warning, Error) for every user action.
- **Character Counter:** Built-in safeguards on inputs displaying real-time character usage with smart styling alerts (`warn` / `danger`).
- **Theme Toggle:** Smooth transformation switch supporting both **Light** and **Dark** interface layouts.
- **Accessibility:** Keyboard navigable shortcuts like `Escape` to discard modifications or close modals instantly.

---

## 🛠️ Tech Stack Used

- **HTML5:** Semantic architecture for structured and accessible data layouts.
- **CSS3:** Custom variables, advanced layouts, and responsive flex designs with keyframe animations.
- **Vanilla JavaScript (ES6+):** Strict state management pipeline, component rendering, and asynchronous local storage API mapping.

---

## 📂 Project Structure

```text
├── index.html       # Application core window and DOM nodes
├── style.css        # Layouts, themes, variables, and animations
└── app.js           # Central state core, event loops, and CRUD actions
