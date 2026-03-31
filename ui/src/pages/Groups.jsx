import { useState, useEffect, useCallback } from 'react'
import api from '../api'
import { useAuth } from '../context/AuthContext'
import styles from './Groups.module.css'

export default function Groups() {
  const { user } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchGroups = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError('')
    try {
      const userId = user.id || user._id
      const res = await api.get(`/api/groups?userId=${userId}`)
      if (res.data.status) {
        const data = res.data.response
        setGroups(Array.isArray(data) ? data : [])
      } else {
        setError(res.data.response || 'Failed to fetch groups')
      }
    } catch (err) {
      setError(err.response?.data?.response || 'Error fetching groups')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  const copyId = (id) => {
    navigator.clipboard.writeText(id).catch(() => {})
  }

  return (
    <>
      <h1 className="page-title">📋 WhatsApp Groups</h1>

      <div className="card">
        <div className={styles.toolbar}>
          <span className={styles.count}>
            {groups.length > 0 ? `${groups.length} groups found` : ''}
          </span>
          <button className="btn btn-secondary btn-sm" onClick={fetchGroups} disabled={loading}>
            {loading ? <span className="spinner spinner-dark" /> : '🔄 Refresh'}
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading && groups.length === 0 ? (
          <div className={styles.loadingBox}>
            <span className="spinner spinner-dark" />
            <span>Fetching groups…</span>
          </div>
        ) : groups.length === 0 && !error ? (
          <div className={styles.emptyBox}>
            <span>No groups found. Make sure your WhatsApp session is active.</span>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Group Name</th>
                  <th>Group ID</th>
                  <th>Participants</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {groups.map((g, i) => (
                  <tr key={g.id || i}>
                    <td>{i + 1}</td>
                    <td>{g.name || g.subject || '—'}</td>
                    <td>
                      <code className={styles.groupId}>{g.id || '—'}</code>
                    </td>
                    <td>{g.participantCount ?? g.participants?.length ?? '—'}</td>
                    <td>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => copyId(g.id)}
                        title="Copy Group ID"
                      >
                        📋 Copy ID
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  )
}
