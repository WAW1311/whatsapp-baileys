import axios from 'axios'

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('wa_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

export default api
