import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: true, // Cho phép truy cập từ các thiết bị khác trong mạng LAN (điện thoại, máy tính bảng)
    port: 5173,
  },
})
