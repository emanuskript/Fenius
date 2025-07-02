// /src/main.js
import { createApp } from 'vue'
import App from './App.vue'      // ← the new root wrapper
import router from './router'

createApp(App)
    .use(router)
    .mount('#app')
