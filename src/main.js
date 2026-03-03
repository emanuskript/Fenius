// /src/main.js
import { createApp } from 'vue'
import App from './App.vue'      // ← the new root wrapper
import router from './router'
import './assets/styles/theme.css'

createApp(App)
    .use(router)
    .mount('#app')
