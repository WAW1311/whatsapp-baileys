# WhatsApp Baileys API Documentation

REST API + bot auto-reply WhatsApp berbasis **Baileys**, dilengkapi dashboard React di folder `ui/`.

## Stack
- **Backend**: Node.js, Express 5, `@whiskeysockets/baileys`, MySQL (`mysql2`), JWT, socket.io
- **Frontend** (`ui/`): React 19, Vite 8, react-router-dom, Tailwind v4

## Prasyarat
- Node.js **20.19+** (syarat Vite 8)
- MySQL 8+ / MariaDB
- Git

## 1. Clone repository
```bash
git clone https://github.com/WAW1311/whatsapp-baileys.git
cd whatsapp-baileys
```

## 2. Konfigurasi `.env` (satu file: backend + frontend)
Satu `.env` di root dibaca backend (Express, via `src/config.js`) **dan** frontend (Vite, `envDir` → root). Salin dari template:
```bash
cp .env.example .env
```
Isi nilainya:

| Variabel | Ruang lingkup | Keterangan |
|---|---|---|
| `PORT` | backend | Port server (default `8000`) |
| `JWT_SECRET` | backend 🔒 | Kunci rahasia JWT (wajib diisi) |
| `JWT_EXPIRES` | backend | Masa berlaku token, mis. `7d` |
| `MYSQL_HOST` | backend | Host MySQL (default `127.0.0.1`) |
| `MYSQL_PORT` | backend | Port MySQL (default `3306`) |
| `MYSQL_USER` | backend | User MySQL |
| `MYSQL_PASSWORD` | backend 🔒 | Password MySQL |
| `MYSQL_DATABASE` | backend | Nama database (default `bot_wa`) |
| `VITE_API_BASE_URL` | frontend 🌐 | Origin backend untuk axios, socket.io, & target proxy dev |

> **Keamanan:** Vite hanya meng-expose variabel ber-prefix `VITE_` ke bundle browser. **Jangan** memberi prefix `VITE_` pada `JWT_SECRET`/`MYSQL_*` — nanti ikut terbawa ke JS publik. File `.env` sudah masuk `.gitignore`.
>
> **`VITE_API_BASE_URL`:** kosongkan saat development (pakai proxy Vite same-origin); isi origin penuh untuk production, mis. `https://waw1311.cloud`.

## 3. Siapkan database
Buat database sesuai `MYSQL_DATABASE`. Tabel (`users`, `bot_commands`) dibuat **otomatis** saat server pertama kali dijalankan.
```sql
CREATE DATABASE bot_wa CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

## 4. Jalankan backend
```bash
npm install
npm start        # node index.js → http://localhost:8000
```
Mode dev (auto-reload, opsional): `npx nodemon index.js`

## 5. Jalankan frontend (dashboard)
```bash
cd ui
npm install
npm run dev      # http://localhost:5173
```
Saat dev, biarkan `VITE_API_BASE_URL` kosong: request `/api` & `/socket.io` otomatis di-proxy ke backend (target = `VITE_API_BASE_URL` atau fallback `http://localhost:8000`).

Build production:
```bash
npm run build    # output ke ui/dist
npm run preview
```
Jika hasil build di-host di origin berbeda dari API, set `VITE_API_BASE_URL` ke origin backend sebelum build.

## Alur singkat pemakaian
1. Buka dashboard → **Register** → **Login**
2. Salin **API Key** dari dashboard
3. **Start Session** → scan **QR** dengan WhatsApp
4. Kirim pesan / kelola bot (lewat UI atau API di bawah)

---

# API Reference

## Base URL

Semua endpoint relatif terhadap base URL berikut:

```
https://api-wawbot.wawtech.id
```

Contoh: `POST https://api-wawbot.wawtech.id/api/auth/login`. Saat development lokal, ganti dengan `http://localhost:8000`.

## Format Response

### Success
```json
{
  "status": true,
  "response": {}
}
```

### Error
```json
{
  "status": false,
  "response": "error message"
}
```

---

## Authentication

Semua endpoint yang butuh auth wajib header:

```http
Authorization: Bearer <JWT_TOKEN>
```

> **Identitas diambil dari token.** Server selalu memakai `userId` milik pemegang token (dari JWT), bukan dari body/query. Field `userId` yang muncul pada endpoint di bawah **hanya ada di response** (informatif) — mengirimnya sebagai input tidak berpengaruh; kamu hanya bisa mengakses session milikmu sendiri.

---

## Auth Endpoints

## 1) Register
- **Method**: `POST`
- **URL**: `/api/auth/register`
- **Auth**: No
- **Content-Type**: `application/json`

### Body
```json
{
  "name": "Admin",
  "email": "admin@mail.com",
  "password": "12345678"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@mail.com"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## 2) Login
- **Method**: `POST`
- **URL**: `/api/auth/login`
- **Auth**: No
- **Content-Type**: `application/json`

### Body
```json
{
  "email": "admin@mail.com",
  "password": "12345678"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@mail.com"
    },
    "token": "JWT_TOKEN"
  }
}
```

---

## 3) Me
- **Method**: `GET`
- **URL**: `/api/auth/me`
- **Auth**: Yes

### Success
```json
{
  "status": true,
  "response": {
    "id": 1,
    "name": "Admin",
    "email": "admin@mail.com",
    "iat": 1710000000,
    "exp": 1710600000
  }
}
```

---

## 3b) Logout (cabut token)
- **Method**: `POST`
- **URL**: `/api/auth/logout`
- **Auth**: Yes

Menaikkan `token_version` user sehingga **semua JWT lama miliknya langsung tidak berlaku**. Setelah ini wajib login ulang. Berguna saat token bocor / logout dari semua perangkat.

### Success
```json
{
  "status": true,
  "response": {
    "message": "Logout berhasil, semua token dicabut."
  }
}
```

> Catatan: ini berbeda dari `POST /api/session/logout` yang hanya memutus sesi WhatsApp, bukan token login.

---

## Session Endpoints

## 4) Start Session
- **Method**: `POST`
- **URL**: `/api/session/start`
- **Auth**: Yes
- **Content-Type**: `application/json`

### Body
Tidak perlu body — `userId` diambil dari token.

### Success
```json
{
  "status": true,
  "response": {
    "userId": "1"
  }
}
```

---

## 5) Get QR
- **Method**: `GET`
- **URL**: `/api/session/qr`
- **Auth**: Yes

### Success (QR tersedia)
```json
{
  "status": true,
  "response": {
    "userId": "1",
    "qr": "data:image/png;base64,iVBORw0KGgoAAA..."
  }
}
```

### Jika belum tersedia / sudah connected
```json
{
  "status": false,
  "response": "QR belum tersedia / session sudah terhubung"
}
```

---

## 6) Logout Session
- **Method**: `POST`
- **URL**: `/api/session/logout`
- **Auth**: Yes
- **Content-Type**: `application/json`

### Body
Tidak perlu body — `userId` diambil dari token.

### Success
```json
{
  "status": true,
  "response": {
    "userId": "1",
    "message": "Session logout & auth folder deleted"
  }
}
```

### Catatan
- Logout dari WhatsApp device (jika socket aktif).
- Menghapus folder auth: `baileys_auth_info/<userId>`.
- Setelah logout, wajib scan QR ulang.

---

## Message Endpoints

## 7) Send Personal Message
- **Method**: `POST`
- **URL**: `/api/send-message`
- **Auth**: Yes
- **Content-Type**:
  - `application/json` (text only)
  - `multipart/form-data` (dengan file)

### Body JSON (text)
```json
{
  "number": "081234567890",
  "message": "Halo dari API"
}
```

### Body Form-Data (media)
- `number` (wajib)
- `message` (opsional)
- `file_dikirim` (opsional, file)

### Success
```json
{
  "status": true,
  "response": {
    "...": "result from Baileys"
  }
}
```

### Error umum
- `400` nomor tidak disertakan
- `404` nomor tidak terdaftar
- `503` WhatsApp belum terhubung
- `500` server error

---

## 8) Send Group Message
- **Method**: `POST`
- **URL**: `/api/send-group-message`
- **Auth**: Yes
- **Content-Type**:
  - `application/json` (text only)
  - `multipart/form-data` (dengan file)

### Body JSON (text)
```json
{
  "id_group": "1203630xxxxxxxxx@g.us",
  "message": "Halo group"
}
```

> `id_group` boleh juga tanpa suffix, sistem akan otomatis tambahkan `@g.us`.

### Body Form-Data (media)
- `id_group` (wajib)
- `message` (opsional)
- `file_dikirim` (opsional, file)

### Success
```json
{
  "status": true,
  "response": {
    "...": "result from Baileys"
  }
}
```

### Error umum
- `400` id_group tidak disertakan
- `404` group tidak ditemukan / tidak bisa diakses
- `503` WhatsApp belum terhubung
- `500` server error

---

## 9) Get All Groups
- **Method**: `GET`
- **URL**: `/api/groups`
- **Auth**: Yes

### Success
```json
{
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
}
```

### Error umum
- `503` WhatsApp belum terhubung
- `500` server error

---

## Utility Endpoints

## 10) Health Check
- **Method**: `GET`
- **URL**: `/health`
- **Auth**: No

### Response
```json
{
  "status": true,
  "response": "OK"
}
```

## 11) Web Scan Page
- **Method**: `GET`
- **URL**: `/scan`
- **Auth**: No

## 12) Home Page
- **Method**: `GET`
- **URL**: `/`
- **Auth**: No

---

## Bot Endpoints

## 13) Get Bot Status & Commands
- **Method**: `GET`
- **URL**: `/api/bot`
- **Auth**: Yes

### Success
```json
{
  "status": true,
  "response": {
    "is_makeBot": true,
    "commands": [
      {
        "id": 1,
        "command": "/hello",
        "response": "Halo! Ada yang bisa aku bantu?",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

---

## 14) Toggle Bot Active Status
- **Method**: `PUT`
- **URL**: `/api/bot/toggle`
- **Auth**: Yes

### Success
```json
{
  "status": true,
  "response": {
    "is_makeBot": true
  }
}
```

### Catatan
- Setiap panggilan membalik status bot (aktif ↔ nonaktif).

---

## 15) Add Bot Command
- **Method**: `POST`
- **URL**: `/api/bot/commands`
- **Auth**: Yes
- **Content-Type**: `application/json`

### Body
```json
{
  "command": "/hello",
  "response": "Halo! Ada yang bisa aku bantu?"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "id": 1,
    "command": "/hello",
    "response": "Halo! Ada yang bisa aku bantu?"
  }
}
```

### Error umum
- `400` command atau response kosong
- `409` command sudah ada (duplikat)
- `500` server error

---

## 16) Update Bot Command
- **Method**: `PUT`
- **URL**: `/api/bot/commands/:id`
- **Auth**: Yes
- **Content-Type**: `application/json`

### Body
```json
{
  "command": "/hello",
  "response": "Halo bro!"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "id": 1,
    "command": "/hello",
    "response": "Halo bro!"
  }
}
```

### Error umum
- `400` command atau response kosong
- `404` command tidak ditemukan
- `409` command sudah ada (duplikat)
- `500` server error

---

## 17) Delete Bot Command
- **Method**: `DELETE`
- **URL**: `/api/bot/commands/:id`
- **Auth**: Yes

### Success
```json
{
  "status": true,
  "response": {
    "message": "Command deleted"
  }
}
```

### Error umum
- `404` command tidak ditemukan
- `500` server error

---

Server menggunakan Socket.IO untuk event QR/status.

## Join Room
- Autentikasi: kirim JWT saat koneksi via handshake `auth.token`, mis. `io(BASE_URL, { auth: { token } })`.
- Event: `join` (tanpa payload).
- Server memverifikasi token lalu memasukkan socket ke room miliknya sendiri. `userId` diambil dari token, bukan dari klien.

Room:
- `user:<userId>`

## Event dari server
- `qr` => Data URL QR
- `qrstatus` => status icon (`./assets/check.svg`, dll)
- `log` => log text

---

## Alur Disarankan

1. Register/Login → dapatkan JWT
2. `POST /api/session/start`
3. `GET /api/session/qr` sampai QR muncul
4. Scan QR di WhatsApp
5. Kirim pesan:
   - personal: `POST /api/send-message`
   - grup: `POST /api/send-group-message`
6. Ambil daftar grup: `GET /api/groups`
7. Kelola bot auto-reply:
   - Status & perintah: `GET /api/bot`
   - Aktifkan/nonaktifkan: `PUT /api/bot/toggle`
   - Tambah perintah: `POST /api/bot/commands`
   - Edit perintah: `PUT /api/bot/commands/:id`
   - Hapus perintah: `DELETE /api/bot/commands/:id`
8. Logout total (opsional): `POST /api/session/logout`

---

## Catatan Penting

- Session aktif disimpan di memory. Jika server restart, panggil `/api/session/start` lagi.
- Selama auth folder belum dihapus, biasanya tidak perlu scan ulang.
- Jika logout / bad session, auth bisa terhapus dan perlu scan ulang.