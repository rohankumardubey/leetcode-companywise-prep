import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'local-catalog-data',
      resolveId(id) {
        if (id === 'virtual:problems-data' || id === 'virtual:solutions-data') {
          return `\0${id}`
        }
        return null
      },
      load(id) {
        const catalogs = {
          '\0virtual:problems-data': {
            file: '.cache/companyProblems.json',
            fallback: '[]',
            warning: 'Company question data is missing. Run ./run.sh before starting Vite.',
          },
          '\0virtual:solutions-data': {
            file: '.cache/solutions.json',
            fallback: JSON.stringify({ available: false, solutions: {} }),
            warning: 'Solution data is missing. Run ./run.sh to enable local solution viewing.',
          },
        }
        const catalog = catalogs[id]
        if (!catalog) return null

        const dataFile = path.resolve(catalog.file)
        if (!fs.existsSync(dataFile)) {
          console.warn(catalog.warning)
          return `export default ${catalog.fallback}`
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
