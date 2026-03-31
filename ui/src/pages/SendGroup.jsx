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

export default function SendGroup() {
  const { user } = useAuth()
  const { toasts, add } = useToast()
  const [form, setForm] = useState({ id_group: '', message: '' })
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
        fd.append('id_group', form.id_group)
        fd.append('message', form.message)
        fd.append('file_dikirim', file)
        res = await api.post('/api/send-group-message', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        res = await api.post('/api/send-group-message', {
          userId,
          id_group: form.id_group,
          message: form.message,
        })
      }

      if (res.data.status) {
        add('Group message sent successfully!', 'success')
        setForm({ id_group: '', message: '' })
        setFile(null)
        e.target.reset()
      } else {
        add(res.data.response || 'Failed to send group message', 'error')
      }
    } catch (err) {
      add(err.response?.data?.response || 'Error sending group message', 'error')
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

      <h1 className="page-title">👥 Send Group Message</h1>

      <div className={`card ${styles.formCard}`}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="id_group">Group ID</label>
            <input
              id="id_group"
              name="id_group"
              type="text"
              className="form-control"
              placeholder="e.g. 1234567890-1234567@g.us"
              value={form.id_group}
              onChange={handleChange}
              required
            />
            <small style={{ color: '#6b7280', fontSize: '0.8rem' }}>
              Get group IDs from the Groups page.
            </small>
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
            {loading ? <span className="spinner" /> : '📤 Send to Group'}
          </button>
        </form>
      </div>
    </>
  )
}
