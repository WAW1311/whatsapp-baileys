import { useState } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './SendPage.module.css'

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }
  return { toasts, add }
}

export default function SendMessage() {
  const { user } = useAuth()
  const { toasts, add } = useToast()
  const [form, setForm] = useState({ number: '', message: '' })
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      let res
      const userId = user.id || user._id
      if (file) {
        const fd = new FormData()
        fd.append('userId', userId)
        fd.append('number', form.number)
        fd.append('message', form.message)
        fd.append('file_dikirim', file)
        res = await api.post('/api/send-message', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.post('/api/send-message', {
          userId,
          number: form.number,
          message: form.message,
        })
      }

      if (res.data.status) {
        add('Message sent successfully!', 'success')
        setForm({ number: '', message: '' })
        setFile(null)
        e.target.reset()
      } else {
        add(res.data.response || 'Failed to send message', 'error')
      }
    } catch (err) {
      add(err.response?.data?.response || 'Error sending message', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <h1 className="page-title">💬 Send Message</h1>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="number">Phone Number</label>
            <input
              id="number"
              name="number"
              type="text"
              className="form-control"
              placeholder="e.g. 628123456789 (with country code, no +)"
              value={form.number}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              className="form-control"
              rows={5}
              placeholder="Type your message here…"
              value={form.message}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="file">Attachment (optional)</label>
            <input
              id="file"
              type="file"
              className="form-control"
              onChange={(e) => setFile(e.target.files[0] || null)}
            />
            {file && (
              <span className={styles.fileName}>📎 {file.name}</span>
            )}
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : '📤 Send Message'}
          </button>
        </form>
      </div>
    </>
  )
}
