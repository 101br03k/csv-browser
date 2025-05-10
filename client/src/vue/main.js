import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import CSVBrowser from './components/CSVBrowser.vue'

// Create routes
const routes = [
  { path: '/', component: CSVBrowser }
]

// Create router
const router = createRouter({
  history: createWebHistory(),
  routes
})

// Create and mount the Vue application
createApp(App)
  .use(router)
  .mount('#app')