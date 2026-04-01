# WhatsApp Baileys API Documentation

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

## Session Endpoints

## 4) Start Session
- **Method**: `POST`
- **URL**: `/api/session/start`
- **Auth**: Yes
- **Content-Type**: `application/json`

### Body (opsional)
```json
{
  "userId": 1
}
```

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
- **Query**: `userId` (opsional)

Contoh:
`/api/session/qr?userId=1`

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

### Body (opsional)
```json
{
  "userId": 1
}
```

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
  "userId": 1,
  "number": "081234567890",
  "message": "Halo dari API"
}
```

### Body Form-Data (media)
- `userId` (opsional)
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
  "userId": 1,
  "id_group": "1203630xxxxxxxxx@g.us",
  "message": "Halo group"
}
```

> `id_group` boleh juga tanpa suffix, sistem akan otomatis tambahkan `@g.us`.

### Body Form-Data (media)
- `userId` (opsional)
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
- **Query**: `userId` (opsional)

Contoh:
`/api/groups?userId=1`

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
        "response": "Hai, aku bot!",
        "created_at": "2024-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### Error umum
- `404` user tidak ditemukan
- `500` server error

---

## 14) Toggle Bot Status
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
- Mengubah status bot (aktif ↔ tidak aktif) untuk user yang sedang login.
- Jika `is_makeBot` = `true`, bot akan membalas pesan masuk sesuai perintah terdaftar.

### Error umum
- `404` user tidak ditemukan
- `500` server error

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
  "response": "Hai, aku bot! Ada yang bisa aku bantu?"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "id": 1,
    "command": "/hello",
    "response": "Hai, aku bot! Ada yang bisa aku bantu?"
  }
}
```

### Error umum
- `400` command atau response tidak disertakan / kosong
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
  "response": "Hai! Ada yang bisa aku bantu?"
}
```

### Success
```json
{
  "status": true,
  "response": {
    "id": 1,
    "command": "/hello",
    "response": "Hai! Ada yang bisa aku bantu?"
  }
}
```

### Error umum
- `400` command atau response tidak disertakan / kosong
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

## Socket.IO Realtime

Server menggunakan Socket.IO untuk event QR/status.

## Join Room
- Event: `join`
- Payload:
```json
{
  "userId": 1
}
```

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
7. Kelola bot otomatis:
   - Aktifkan: `PUT /api/bot/toggle`
   - Tambah perintah: `POST /api/bot/commands`
   - Edit perintah: `PUT /api/bot/commands/:id`
   - Hapus perintah: `DELETE /api/bot/commands/:id`
8. Logout total (opsional): `POST /api/session/logout`

---

## Catatan Penting

- Session aktif disimpan di memory. Jika server restart, panggil `/api/session/start` lagi.
- Selama auth folder belum dihapus, biasanya tidak perlu scan ulang.
- Jika logout / bad session, auth bisa terhapus dan perlu scan ulang.