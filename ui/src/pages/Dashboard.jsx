import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import styles from './Dashboard.module.css'

function useToast() {
  const [toasts, setToasts] = useState([])
  const add = (msg, type = 'success') => {
    const id = Date.now()
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }
  return { toasts, add }
}

export default function Dashboard() {
  const { user, token } = useAuth()
  const { toasts, add } = useToast()

  const [qrImage, setQrImage] = useState(null)
  const [statusIcon, setStatusIcon] = useState(null)
  const [logs, setLogs] = useState([])
  const [sessionLoading, setSessionLoading] = useState(false)
  const [logoutLoading, setLogoutLoading] = useState(false)
  const socketRef = useRef(null)

  const maskToken = (value) => {
    if (!value) return '—'
    if (value.length <= 10) return `${value.slice(0, 2)}***${value.slice(-2)}`
    return `${value.slice(0, 6)}...${value.slice(-4)}`
  }

  const copyApiKey = async () => {
    if (!token) return
    try {
      await navigator.clipboard.writeText(token)
      add('API Key berhasil disalin', 'success')
    } catch (err) {
      add('Gagal menyalin API Key', 'error')
    }
  }

  useEffect(() => {
    if (!user) return

    const socket = io('/', { auth: { token }, transports: ['websocket', 'polling'] })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join')
    })

    socket.on('qr', (dataUrl) => {
      setQrImage(dataUrl)
      setStatusIcon(null)
    })

    socket.on('qrstatus', (iconPath) => {
      const normalized = iconPath.replace(/^\.\//, '/')
      setStatusIcon(normalized)
      setQrImage(null)
    })

    socket.on('log', (text) => {
      setLogs((prev) => [`[${new Date().toLocaleTimeString()}] ${text}`, ...prev].slice(0, 50))
    })

    return () => {
      socket.disconnect()
    }
  }, [user, token])

  const startSession = async () => {
    setSessionLoading(true)
    try {
      const res = await api.post('/api/session/start', {})
      if (res.data.status) {
        add('Session started – scan the QR code', 'success')
      } else {
        add(res.data.response || 'Failed to start session', 'error')
      }
    } catch (err) {
      add(err.response?.data?.response || 'Error starting session', 'error')
    } finally {
      setSessionLoading(false)
    }
  }

  const logoutSession = async () => {
    setLogoutLoading(true)
    try {
      const res = await api.post('/api/session/logout', {})
      if (res.data.status) {
        add('WhatsApp session logged out', 'success')
        setQrImage(null)
        setStatusIcon(null)
      } else {
        add(res.data.response || 'Failed to logout', 'error')
      }
    } catch (err) {
      add(err.response?.data?.response || 'Error logging out', 'error')
    } finally {
      setLogoutLoading(false)
    }
  }

  return (
    <>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <h1 className="page-title">Dashboard</h1>

      <div className={styles.grid}>
        <div className={`card ${styles.userCard}`}>
          <h2 className={styles.sectionTitle}>👤 Account</h2>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Name</span>
            <span>{user?.name || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>Email</span>
            <span>{user?.email || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>User ID</span>
            <span className={styles.mono}>{user?.id || user?._id || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span className={styles.infoLabel}>API Key</span>
            <div className={styles.tokenWrap}>
              <span className={styles.token}>{maskToken(token)}</span>
              <button
                type="button"
                className={styles.copyBtn}
                onClick={copyApiKey}
                disabled={!token}
                aria-label="Copy API Key"
                title="Copy API Key"
              >
                📋 Copy
              </button>
            </div>
          </div>
        </div>

        <div className={`card ${styles.sessionCard}`}>
          <h2 className={styles.sectionTitle}>📱 WhatsApp Session</h2>

          <div className={styles.qrArea}>
            {qrImage ? (
              <div className={styles.qrBox}>
                <img src={qrImage} alt="QR Code" className={styles.qrImg} />
                <p className={styles.qrHint}>Scan with WhatsApp on your phone</p>
              </div>
            ) : statusIcon ? (
              <div className={styles.statusBox}>
                <img src={statusIcon} alt="Status" className={styles.statusImg} />
              </div>
            ) : (
              <div className={styles.noSession}>
                <span className={styles.noSessionIcon}>📵</span>
                <p>No active session. Start one to get a QR code.</p>
              </div>
            )}
          </div>

          <div className={styles.sessionActions}>
            <button className="btn btn-primary" onClick={startSession} disabled={sessionLoading}>
              {sessionLoading ? <span className="spinner" /> : '▶ Start Session'}
            </button>
            <button className="btn btn-danger" onClick={logoutSession} disabled={logoutLoading}>
              {logoutLoading ? <span className="spinner" /> : '⏏ Logout Session'}
            </button>
          </div>
        </div>

        <div className={`card ${styles.logCard}`}>
          <h2 className={styles.sectionTitle}>📋 Realtime Logs</h2>
          <div className={styles.logBox}>
            {logs.length === 0 ? (
              <span className={styles.logEmpty}>No logs yet…</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className={styles.logLine}>{l}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}