'use client'

import styles from './Documentation.module.css'
import Navbar from '../../components/Navbar'
import ProtectedRoute from '../../components/ProtectedRoute'

const endpoints = [
  {
    section: 'Message Endpoints',
    items: [
      {
        id: 7,
        title: 'Send Personal Message',
        method: 'POST',
        url: '/api/send-message',
        auth: true,
        contentType: 'application/json atau multipart/form-data',
        body: `{
  "number": "081234567890",
  "message": "Halo dari API"
}`,
        bodyNote: 'Form-Data: number (wajib), message (opsional), file_dikirim (opsional)',
        success: `{
  "status": true,
  "response": {
    "...": "result from Baileys"
  }
}`,
        errors: [
          '400 — nomor tidak disertakan',
          '404 — nomor tidak terdaftar',
          '503 — WhatsApp belum terhubung',
          '500 — server error',
        ],
      },
      {
        id: 8,
        title: 'Send Group Message',
        method: 'POST',
        url: '/api/send-group-message',
        auth: true,
        contentType: 'application/json atau multipart/form-data',
        body: `{
  "id_group": "1203630xxxxxxxxx@g.us",
  "message": "Halo group"
}`,
        bodyNote: 'id_group boleh tanpa suffix, sistem otomatis tambahkan @g.us. Form-Data: id_group (wajib), message (opsional), file_dikirim (opsional)',
        success: `{
  "status": true,
  "response": {
    "...": "result from Baileys"
  }
}`,
        errors: [
          '400 — id_group tidak disertakan',
          '404 — group tidak ditemukan / tidak bisa diakses',
          '503 — WhatsApp belum terhubung',
          '500 — server error',
        ],
      },
      {
        id: 9,
        title: 'Get All Groups',
        method: 'GET',
        url: '/api/groups',
        auth: true,
        success: `{
  "status": true,
  "response": {
    "userId": "1",
    "total": 2,
    "groups": [
      {
        "id": "1203630xxxxxxxxx@g.us",
        "subject": "Tim Backend",
        "subjectOwner": "62812xxxx@s.whatsapp.net",
        "subjectTime": 1710000000,
        "size": 25,
        "creation": 1709000000,
        "owner": "62812xxxx@s.whatsapp.net",
        "desc": "Group diskusi backend"
      }
    ]
  }
}`,
        errors: [
          '503 — WhatsApp belum terhubung',
          '500 — server error',
        ],
      },
    ],
  },
]

const METHOD_COLOR = {
  GET: styles.methodGet,
  POST: styles.methodPost,
  PUT: styles.methodPut,
  DELETE: styles.methodDelete,
}

function EndpointCard({ item }) {
  return (
    <div className={styles.endpointCard}>
      <div className={styles.endpointHeader}>
        <span className={`${styles.method} ${METHOD_COLOR[item.method] || ''}`}>
          {item.method}
        </span>
        <span className={styles.endpointTitle}>
          {item.id}. {item.title}
        </span>
        <code className={styles.url}>{item.url}</code>
        <span className={`${styles.authBadge} ${item.auth ? styles.authRequired : styles.authNone}`}>
          {item.auth ? '🔒 Auth' : '🔓 No Auth'}
        </span>
      </div>

      {item.contentType && (
        <div className={styles.meta}>
          <span className={styles.metaLabel}>Content-Type:</span>
          <span>{item.contentType}</span>
        </div>
      )}

      {item.body && (
        <div className={styles.codeBlock}>
          <div className={styles.codeLabel}>
            Request Body {item.bodyNote && <span className={styles.bodyNote}>{item.bodyNote}</span>}
          </div>
          <pre><code>{item.body}</code></pre>
        </div>
      )}

      {item.success && (
        <div className={`${styles.codeBlock} ${styles.codeSuccess}`}>
          <div className={styles.codeLabel}>✅ Success Response</div>
          <pre><code>{item.success}</code></pre>
        </div>
      )}

      {item.errors && item.errors.length > 0 && (
        <div className={styles.errors}>
          <div className={styles.codeLabel}>⚠️ Error umum</div>
          <ul>
            {item.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function DocumentationContent() {
  return (
    <>
      <h1 className="page-title">📖 Dokumentasi API</h1>

      <div className={`card ${styles.formatCard}`}>
        <h2 className={styles.sectionTitle}>Format Response</h2>
        <div className={styles.formatGrid}>
          <div>
            <div className={`${styles.codeBlock} ${styles.codeSuccess}`}>
              <div className={styles.codeLabel}>✅ Success</div>
              <pre><code>{`{
  "status": true,
  "response": {}
}`}</code></pre>
            </div>
          </div>
          <div>
            <div className={`${styles.codeBlock} ${styles.codeError}`}>
              <div className={styles.codeLabel}>❌ Error</div>
              <pre><code>{`{
  "status": false,
  "response": "error message"
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <div className={`card ${styles.authNote}`}>
        <h2 className={styles.sectionTitle}>🔒 Authentication</h2>
        <p>Semua endpoint yang butuh auth wajib header:</p>
        <div className={styles.codeBlock}>
          <pre><code>Authorization: Bearer &lt;API_KEY&gt;</code></pre>
        </div>
      </div>

      {endpoints.map((section) => (
        <div key={section.section} className={styles.section}>
          <h2 className={styles.sectionHeading}>{section.section}</h2>
          {section.items.map((item) => (
            <EndpointCard key={item.id} item={item} />
          ))}
        </div>
      ))}
    </>
  )
}

export default function DocumentationPage() {
  return (
    <ProtectedRoute>
      <Navbar />
      <main className="main-content">
        <DocumentationContent />
      </main>
    </ProtectedRoute>
  )
}
