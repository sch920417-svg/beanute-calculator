import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // React 엔진이 중복 설치되어도 무조건 하나만 사용하도록 강제 (useContext 에러 해결)
    dedupe: ['react', 'react-dom'],
  },
})