<template>
  <div class="app-container">
    <header class="app-header">
      <div class="logo">
        <svg xmlns="http://www.w3.org/2000/svg" class="header-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h1>Vue CSV Viewer</h1>
      </div>
    </header>
    <main class="app-content">
      <CSVViewer />
    </main>
    <footer class="app-footer">
      <p>Vue CSV Viewer | Browser-based CSV Analysis Tool</p>
    </footer>
  </div>
</template>

<script>
import CSVViewer from './components/CSVViewer.vue';

export default {
  name: 'App',
  components: {
    CSVViewer
  }
}
</script>

<style>
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #e5e7eb;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --white: #ffffff;
  --danger: #ef4444;
  --success: #10b981;
  --border-color: #e5e7eb;
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: var(--text-color);
  line-height: 1.5;
  background-color: #f9fafb;
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--white);
  box-shadow: var(--shadow);
  padding: 1rem;
}

.logo {
  display: flex;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  padding: 0 1rem;
}

.header-icon {
  width: 1.75rem;
  height: 1.75rem;
  color: var(--primary-color);
  margin-right: 0.75rem;
}

.app-header h1 {
  font-size: 1.5rem;
  font-weight: 600;
}

.app-content {
  flex: 1;
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.app-footer {
  background-color: var(--white);
  border-top: 1px solid var(--border-color);
  padding: 1rem;
  text-align: center;
  color: var(--text-light);
  font-size: 0.875rem;
}

/* Button styles */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.375rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-primary {
  background-color: var(--primary-color);
  color: var(--white);
  border: 1px solid var(--primary-color);
}

.btn-primary:hover {
  background-color: var(--primary-hover);
}

.btn-secondary {
  background-color: var(--white);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background-color: var(--secondary-color);
}

.btn-danger {
  background-color: var(--danger);
  color: var(--white);
  border: 1px solid var(--danger);
}

.btn-icon {
  margin-right: 0.5rem;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Card styles */
.card {
  background-color: var(--white);
  border-radius: 0.5rem;
  box-shadow: var(--shadow);
  margin-bottom: 1.5rem;
}

.card-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-color);
}

.card-body {
  padding: 1.5rem;
}

/* Form styles */
.form-group {
  margin-bottom: 1rem;
}

.form-label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
}

/* Layout utilities */
.flex {
  display: flex;
}

.flex-col {
  flex-direction: column;
}

.items-center {
  align-items: center;
}

.justify-between {
  justify-content: space-between;
}

.gap-2 {
  gap: 0.5rem;
}

.gap-4 {
  gap: 1rem;
}

.mt-2 {
  margin-top: 0.5rem;
}

.mt-4 {
  margin-top: 1rem;
}

.mb-2 {
  margin-bottom: 0.5rem;
}

.mb-4 {
  margin-bottom: 1rem;
}

.p-4 {
  padding: 1rem;
}

/* Responsive utilities */
@media (max-width: 640px) {
  .app-header h1 {
    font-size: 1.25rem;
  }
}
</style>