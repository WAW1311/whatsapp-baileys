import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://waw1311.cloud",
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('wa_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
