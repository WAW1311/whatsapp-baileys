import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBook, faCheck, faXmark, faLock, faLockOpen,
  faTriangleExclamation, faNoteSticky,
} from '@fortawesome/free-solid-svg-icons'

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
        query: undefined,
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
  }
]

const METHOD_CLASSES = {
  GET: 'bg-emerald-500',
  POST: 'bg-blue-500',
  PUT: 'bg-amber-500',
  DELETE: 'bg-red-500',
}

function EndpointCard({ item }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 mb-3">
      <div className="flex items-center flex-wrap gap-2 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wide text-white ${METHOD_CLASSES[item.method] || 'bg-gray-500'}`}>
          {item.method}
        </span>
        <span className="font-semibold text-gray-900 text-sm">{item.id}. {item.title}</span>
        <code className="text-xs bg-gray-100 px-2 py-0.5 rounded text-violet-700 font-mono">{item.url}</code>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${item.auth ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
          <FontAwesomeIcon icon={item.auth ? faLock : faLockOpen} />
          {item.auth ? 'Auth' : 'No Auth'}
        </span>
      </div>

      {item.contentType && (
        <div className="text-sm text-gray-500 mb-1 flex gap-1.5 flex-wrap items-baseline">
          <span className="font-semibold text-gray-700">Content-Type:</span>
          <span>{item.contentType}</span>
        </div>
      )}

      {item.query && (
        <div className="text-sm text-gray-500 mb-1 flex gap-1.5 flex-wrap items-baseline">
          <span className="font-semibold text-gray-700">Query:</span>
          <span>{item.query}</span>
        </div>
      )}

      {item.body && (
        <div className="bg-gray-800 text-gray-200 rounded-md px-4 py-3 mt-2 text-xs overflow-x-auto">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
            Request Body {item.bodyNote && <span className="normal-case font-normal text-gray-500 ml-1.5">{item.bodyNote}</span>}
          </div>
          <pre className="m-0"><code className="font-mono whitespace-pre">{item.body}</code></pre>
        </div>
      )}

      {item.success && (
        <div className="bg-gray-800 text-gray-200 rounded-md px-4 py-3 mt-2 text-xs overflow-x-auto border-l-4 border-emerald-500">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <FontAwesomeIcon icon={faCheck} className="text-emerald-400" /> Success Response
          </div>
          <pre className="m-0"><code className="font-mono whitespace-pre">{item.success}</code></pre>
        </div>
      )}

      {item.errors && item.errors.length > 0 && (
        <div className="mt-2 text-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <FontAwesomeIcon icon={faTriangleExclamation} className="text-amber-500" /> Error umum
          </div>
          <ul className="pl-5 mt-1 text-gray-700 leading-relaxed list-disc">
            {item.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </div>
      )}

      {item.notes && item.notes.length > 0 && (
        <div className="mt-2 text-sm">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
            <FontAwesomeIcon icon={faNoteSticky} className="text-blue-400" /> Catatan
          </div>
          <ul className="pl-5 mt-1 text-gray-700 leading-relaxed list-disc">
            {item.notes.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

export default function Documentation() {
  return (
    <>
      <h1 className="page-title">
        <FontAwesomeIcon icon={faBook} className="text-violet-600" />
        Dokumentasi API
      </h1>

      {/* Format Response */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-3 text-gray-700">Format Response</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="bg-gray-800 text-gray-200 rounded-md px-4 py-3 text-xs overflow-x-auto border-l-4 border-emerald-500">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faCheck} className="text-emerald-400" /> Success
              </div>
              <pre className="m-0"><code className="font-mono whitespace-pre">{`{
  "status": true,
  "response": {}
}`}</code></pre>
            </div>
          </div>
          <div>
            <div className="bg-gray-800 text-gray-200 rounded-md px-4 py-3 text-xs overflow-x-auto border-l-4 border-red-500">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                <FontAwesomeIcon icon={faXmark} className="text-red-400" /> Error
              </div>
              <pre className="m-0"><code className="font-mono whitespace-pre">{`{
  "status": false,
  "response": "error message"
}`}</code></pre>
            </div>
          </div>
        </div>
      </div>

      {/* Authentication note */}
      <div className="card mb-5">
        <h2 className="text-base font-semibold mb-2 text-gray-700 flex items-center gap-2">
          <FontAwesomeIcon icon={faLock} className="text-amber-500" />
          Authentication
        </h2>
        <p className="text-sm text-gray-600 mb-2">Semua endpoint yang butuh auth wajib header:</p>
        <div className="bg-gray-800 text-gray-200 rounded-md px-4 py-3 text-xs overflow-x-auto">
          <pre className="m-0"><code className="font-mono">Authorization: Bearer &lt;API_KEY&gt;</code></pre>
        </div>
      </div>

      {/* Endpoint sections */}
      {endpoints.map((section) => (
        <div key={section.section} className="mb-6">
          <h2 className="text-lg font-bold text-violet-600 mb-3 pb-1 border-b-2 border-violet-100">
            {section.section}
          </h2>
          {section.items.map((item) => (
            <EndpointCard key={item.id} item={item} />
          ))}
        </div>
      ))}
    </>
  )
}

