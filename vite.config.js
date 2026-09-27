import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss()
    ],
    resolve: {
      dedupe: ["react", "react-dom", "react-router", "react-router-dom", "@phosphor-icons/react"],
    },
    server: {
      port: Number(env.VITE_PORT) || 5173,
    },
  }
})
