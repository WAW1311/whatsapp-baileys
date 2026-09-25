require("dotenv").config();

// JWT_SECRET wajib & kuat — tidak ada fallback hardcoded.
// Fallback rahasia yang ter-commit = siapa pun bisa memalsukan token semua user.
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET || JWT_SECRET.length < 32) {
  console.error(
    "FATAL: JWT_SECRET wajib diisi di .env dan minimal 32 karakter. " +
    "Buat dengan: node -e \"console.log(require('crypto').randomBytes(48).toString('hex'))\""
  );
  process.exit(1);
}

module.exports = {
  PORT: Number(process.env.PORT || 8000),
  JWT_SECRET,
  JWT_EXPIRES: process.env.JWT_EXPIRES || "1d",

  MYSQL_HOST: process.env.MYSQL_HOST || "127.0.0.1",
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || "root",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || "bot_wa",

  // Origin frontend yang diizinkan (CORS). Pisah dengan koma untuk banyak origin.
  // Kosong = izinkan semua (hanya untuk development) + tampilkan peringatan.
  CORS_ORIGIN: process.env.CORS_ORIGIN || "",
};
