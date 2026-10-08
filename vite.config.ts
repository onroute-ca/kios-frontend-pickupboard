import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  // App is served under this prefix (see k8s/dev/ingress.yaml)
  base: "/pickupboard/",
  plugins: [react(), tailwindcss()],
})
