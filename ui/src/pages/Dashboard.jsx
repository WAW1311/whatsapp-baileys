import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useAuth } from '../context/AuthContext'
import api from '../api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faUser, faMobileScreen, faClipboardList, faCircleXmark,
  faCopy, faPlay, faEject,
} from '@fortawesome/free-solid-svg-icons'

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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Account card */}
        <div className="card">
          <h2 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-700">
            <FontAwesomeIcon icon={faUser} className="text-violet-600" />
            Account
          </h2>
          <div className="flex justify-between py-1.5 border-b border-gray-100 text-sm last:border-b-0">
            <span className="text-gray-500 font-medium">Name</span>
            <span>{user?.name || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-gray-100 text-sm">
            <span className="text-gray-500 font-medium">Email</span>
            <span>{user?.email || '—'}</span>
          </div>
          <div className="flex justify-between py-1.5 text-sm items-center">
            <span className="text-gray-500 font-medium">API Key</span>
            <div className="inline-flex items-center gap-2 min-w-0">
              <span className="font-mono text-xs truncate max-w-[140px]">{maskToken(token)}</span>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 border border-gray-300 bg-white text-gray-800 rounded-lg px-2.5 py-1.5 text-xs cursor-pointer transition-all hover:bg-gray-50 disabled:opacity-55 disabled:cursor-not-allowed"
                onClick={copyApiKey}
                disabled={!token}
                aria-label="Copy API Key"
                title="Copy API Key"
              >
                <FontAwesomeIcon icon={faCopy} />
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* WhatsApp Session card – spans 2 rows on md+ */}
        <div className="card md:row-span-2">
          <h2 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-700">
            <FontAwesomeIcon icon={faMobileScreen} className="text-violet-600" />
            WhatsApp Session
          </h2>

          <div className="min-h-[200px] flex items-center justify-center mb-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 p-4">
            {qrImage ? (
              <div className="text-center">
                <img src={qrImage} alt="QR Code" className="max-w-[200px] w-full rounded-md" />
                <p className="text-xs text-gray-500 mt-2">Scan with WhatsApp on your phone</p>
              </div>
            ) : statusIcon ? (
              <div className="flex items-center justify-center">
                <img src={statusIcon} alt="Status" className="w-20 h-20 object-contain" />
              </div>
            ) : (
              <div className="text-center text-gray-400">
                <FontAwesomeIcon icon={faCircleXmark} className="text-5xl mb-2 block" />
                <p className="text-sm">No active session. Start one to get a QR code.</p>
              </div>
            )}
          </div>

          <div className="flex gap-3 flex-wrap">
            <button className="btn btn-primary" onClick={startSession} disabled={sessionLoading}>
              {sessionLoading ? <span className="spinner" /> : <><FontAwesomeIcon icon={faPlay} /> Start Session</>}
            </button>
            <button className="btn btn-danger" onClick={logoutSession} disabled={logoutLoading}>
              {logoutLoading ? <span className="spinner" /> : <><FontAwesomeIcon icon={faEject} /> Logout Session</>}
            </button>
          </div>
        </div>

        {/* Realtime Logs card */}
        <div className="card">
          <h2 className="flex items-center gap-2 text-base font-semibold mb-4 text-gray-700">
            <FontAwesomeIcon icon={faClipboardList} className="text-violet-600" />
            Realtime Logs
          </h2>
          <div className="bg-gray-800 text-green-200 rounded-md p-3 h-44 overflow-y-auto font-mono text-xs leading-relaxed">
            {logs.length === 0 ? (
              <span className="text-gray-500 italic">No logs yet…</span>
            ) : (
              logs.map((l, i) => (
                <div key={i} className="py-0.5 border-b border-white/5">{l}</div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}
