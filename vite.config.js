import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

import { getA11yConfig, revisionWatcherVitePlugin } from 'beeline-vue-devtools/src/versioning.js'

console.log('hi')

export default async () => {
  const a11yConfig = await getA11yConfig(import.meta.url)
  console.log({a11yConfig})
  return defineConfig({
    define: {
      ...a11yConfig,
      'process.env.test': true
    },
    plugins: [
      vue(),
      revisionWatcherVitePlugin()
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      }
    }
  })
}
