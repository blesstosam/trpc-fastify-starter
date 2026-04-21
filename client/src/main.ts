import { createPinia } from 'pinia'

import { createApp } from 'vue'
import App from './App.vue'

import router from './router'

import 'ant-design-vue/dist/reset.css'
import './shared/assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
