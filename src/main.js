import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { DevtoolsPlugin, prepareA11YAudit } from 'beeline-vue-devtools/src/devtools'

const app = createApp(App)

console.log('hii1')

app.use(router)
app.use(DevtoolsPlugin)

app.mount('#app')

console.log('findthiss', (import.meta.env.DEV && process.env.AUDITA11Y) ? 'GOOD' : 'BAD', import.meta.env, process.env)
if (import.meta.env.DEV && process.env.AUDITA11Y) {
    prepareA11YAudit(router)
}
