import { useState, useEffect, useCallback, useRef } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faRobot, faCircleCheck, faBan, faPenToSquare, faPlus,
  faTrash, faClipboardList
} from '@fortawesome/free-solid-svg-icons'
import api from '../api'
import styles from './MakeABot.module.css'

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
      <div className={styles.loadingWrap}>
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

      <h1 className="page-title"><FontAwesomeIcon icon={faRobot} /> Make a Bot</h1>

      <div className={styles.grid}>
        {/* Toggle card */}
        <div className={`card ${styles.toggleCard}`}>
          <h2 className={styles.sectionTitle}>Status Bot</h2>
          <p className={styles.desc}>
            Aktifkan fitur bot agar WhatsApp dapat membalas pesan masuk secara otomatis
            berdasarkan perintah yang telah kamu definisikan.
          </p>
          <div className={styles.toggleRow}>
            <span className={styles.toggleLabel}>
              {isMakeBot
                ? <><FontAwesomeIcon icon={faCircleCheck} /> Bot Aktif</>
                : <><FontAwesomeIcon icon={faBan} /> Bot Tidak Aktif</>
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
        <div className={`card ${styles.formCard}`}>
          <h2 className={styles.sectionTitle}>
            {editingId !== null
              ? <><FontAwesomeIcon icon={faPenToSquare} /> Edit Perintah</>
              : <><FontAwesomeIcon icon={faPlus} /> Tambah Perintah</>
            }
          </h2>
          <form onSubmit={handleSubmit} className={styles.form}>
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
                className={`form-control ${styles.textarea}`}
                placeholder="Contoh: Hai, aku bot! Ada yang bisa aku bantu?"
                value={form.response}
                onChange={(e) => setForm((f) => ({ ...f, response: e.target.value }))}
                rows={4}
              />
            </div>
            <div className={styles.formActions}>
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
        <div className={`card ${styles.tableCard}`}>
          <h2 className={styles.sectionTitle}><FontAwesomeIcon icon={faClipboardList} /> Daftar Perintah ({commands.length})</h2>
          {commands.length === 0 ? (
            <p className={styles.empty}>Belum ada perintah. Tambahkan di atas.</p>
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
                    <tr key={cmd.id} className={editingId === cmd.id ? styles.editingRow : ''}>
                      <td>{idx + 1}</td>
                      <td><code className={styles.code}>{cmd.command}</code></td>
                      <td className={styles.responseCell}>{cmd.response}</td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => startEdit(cmd)}
                            disabled={deletingId === cmd.id}
                          >
                            <FontAwesomeIcon icon={faPenToSquare} /> Edit
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
