import axios from 'axios'

const api = axios.create({
  // Sumber tunggal dari root .env (VITE_API_BASE_URL). Kosong = relatif → lewat proxy Vite saat dev.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
