import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'local-problems-data',
      resolveId(id) {
        return id === 'virtual:problems-data' ? '\0virtual:problems-data' : null
      },
      load(id) {
        if (id !== '\0virtual:problems-data') return null

        const dataFile = path.resolve('.cache/companyProblems.json')
        if (!fs.existsSync(dataFile)) {
          console.warn('Company question data is missing. Run ./run.sh before starting Vite.')
          return 'export default []'
        }
        this.addWatchFile(dataFile)

        return `export default ${fs.readFileSync(dataFile, 'utf8')}`
      },
    },
  ],
  base: command === 'serve' ? '/' : '/leetcode-companywise-prep/',
  server: {
    allowedHosts: ["quiet-stone-1cec.tunnl.gg"],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js',
    css: false,
  },
}))
