import { createApp } from 'vue'
import App from './App.vue'
import { createRouter, createWebHistory } from 'vue-router'
import CSVViewer from './components/CSVViewer.vue'

// Create routes
const routes = [
  { path: '/', component: CSVViewer }
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