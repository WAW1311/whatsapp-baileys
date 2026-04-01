import { useState, useEffect, useCallback, useRef } from 'react'
import api from '../api'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot, faCheckCircle, faBan, faPen, faPlus,
  faClipboardList, faTrash,
} from '@fortawesome/free-solid-svg-icons'

function useToast() {
  const [toasts, setToasts] = useState([])
  const counter = useRef(0)
  const add = useCallback((msg, type = 'success') => {
    const id = ++counter.current
    setToasts((t) => [...t, { id, msg, type }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500)
  }, [])
  return { toasts, add }
}

const EMPTY_FORM = { command: '', response: '' }

export default function MakeABot() {
  const { toasts, add } = useToast()

  const [isMakeBot, setIsMakeBot] = useState(false)
  const [commands, setCommands] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const fetchBot = useCallback(async () => {
    try {
      const res = await api.get('/api/bot')
      if (res.data.status) {
        setIsMakeBot(res.data.response.is_makeBot)
        setCommands(res.data.response.commands)
      }
    } catch (e) {
      add(e.response?.data?.response || 'Gagal memuat data bot', 'error')
    } finally {
      setLoading(false)
    }
  }, [add])

  useEffect(() => {
    fetchBot()
  }, [fetchBot])

  const handleToggle = async () => {
    setToggling(true)
    try {
      const res = await api.put('/api/bot/toggle')
      if (res.data.status) {
        setIsMakeBot(res.data.response.is_makeBot)
        add(res.data.response.is_makeBot ? 'Bot diaktifkan' : 'Bot dinonaktifkan', 'success')
      }
    } catch (e) {
      add(e.response?.data?.response || 'Gagal mengubah status bot', 'error')
    } finally {
      setToggling(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.command.trim() || !form.response.trim()) {
      add('Perintah dan tanggapan tidak boleh kosong', 'error')
      return
    }
    setSaving(true)
    try {
      let res
      if (editingId !== null) {
        res = await api.put(`/api/bot/commands/${editingId}`, form)
      } else {
        res = await api.post('/api/bot/commands', form)
      }
      if (res.data.status) {
        add(editingId !== null ? 'Perintah diperbarui' : 'Perintah ditambahkan', 'success')
        setForm(EMPTY_FORM)
        setEditingId(null)
        await fetchBot()
      }
    } catch (e) {
      add(e.response?.data?.response || 'Gagal menyimpan perintah', 'error')
    } finally {
      setSaving(false)
    }
  }

  const startEdit = (cmd) => {
    setEditingId(cmd.id)
    setForm({ command: cmd.command, response: cmd.response })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const cancelEdit = () => {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const handleDelete = async (id) => {
    setDeletingId(id)
    try {
      const res = await api.delete(`/api/bot/commands/${id}`)
      if (res.data.status) {
        add('Perintah dihapus', 'success')
        setCommands((prev) => prev.filter((c) => c.id !== id))
        if (editingId === id) cancelEdit()
      }
    } catch (e) {
      add(e.response?.data?.response || 'Gagal menghapus perintah', 'error')
    } finally {
      setDeletingId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <span className="spinner spinner-dark" />
      </div>
    )
  }

  return (
    <>
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>{t.msg}</div>
        ))}
      </div>

      <h1 className="page-title">
        <FontAwesomeIcon icon={faRobot} className="text-violet-600" />
        Make a Bot
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Toggle card */}
        <div className="card flex flex-col gap-3">
          <h2 className="text-lg font-bold text-gray-900 mb-2">Status Bot</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Aktifkan fitur bot agar WhatsApp dapat membalas pesan masuk secara otomatis
            berdasarkan perintah yang telah kamu definisikan.
          </p>
          <div className="flex items-center justify-between gap-4 flex-wrap mt-1">
            <span className="text-base font-semibold text-gray-700 flex items-center gap-2">
              {isMakeBot
                ? <><FontAwesomeIcon icon={faCheckCircle} className="text-green-500" /> Bot Aktif</>
                : <><FontAwesomeIcon icon={faBan} className="text-red-500" /> Bot Tidak Aktif</>
              }
            </span>
            <button
              className={`btn ${isMakeBot ? 'btn-danger' : 'btn-primary'}`}
              onClick={handleToggle}
              disabled={toggling}
            >
              {toggling ? <span className="spinner" /> : isMakeBot ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        </div>

        {/* Add / Edit form card */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            {editingId !== null
              ? <><FontAwesomeIcon icon={faPen} className="text-violet-600" /> Edit Perintah</>
              : <><FontAwesomeIcon icon={faPlus} className="text-violet-600" /> Tambah Perintah</>
            }
          </h2>
          <form onSubmit={handleSubmit} className="flex flex-col gap-2">
            <div className="form-group">
              <label htmlFor="command">Perintah</label>
              <input
                id="command"
                className="form-control"
                placeholder="Contoh: /hello"
                value={form.command}
                onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                autoComplete="off"
              />
            </div>
            <div className="form-group">
              <label htmlFor="response">Tanggapan</label>
              <textarea
                id="response"
                className="form-control resize-y min-h-[80px]"
                placeholder="Contoh: Hai, aku bot! Ada yang bisa aku bantu?"
                value={form.response}
                onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}
                rows={4}
              />
            </div>
            <div className="flex gap-3 flex-wrap mt-1">
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" /> : editingId !== null ? 'Simpan Perubahan' : 'Tambah'}
              </button>
              {editingId !== null && (
                <button type="button" className="btn btn-secondary" onClick={cancelEdit}>
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Commands table card */}
        <div className="card md:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <FontAwesomeIcon icon={faClipboardList} className="text-violet-600" />
            Daftar Perintah ({commands.length})
          </h2>
          {commands.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-6">Belum ada perintah. Tambahkan di atas.</p>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Perintah</th>
                    <th>Tanggapan</th>
                    <th>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {commands.map((cmd, idx) => (
                    <tr key={cmd.id} className={editingId === cmd.id ? 'bg-violet-50' : ''}>
                      <td>{idx + 1}</td>
                      <td>
                        <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[0.88rem] text-violet-700 font-mono">
                          {cmd.command}
                        </code>
                      </td>
                      <td className="max-w-[260px] break-words whitespace-pre-wrap">{cmd.response}</td>
                      <td>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(cmd)}
                            disabled={deletingId === cmd.id}
                          >
                            <FontAwesomeIcon icon={faPen} /> Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(cmd.id)}
                            disabled={deletingId === cmd.id}
                          >
                            {deletingId === cmd.id ? <span className="spinner" /> : <><FontAwesomeIcon icon={faTrash} /> Hapus</>}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

