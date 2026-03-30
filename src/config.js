require("dotenv").config();

module.exports = {
  PORT: Number(process.env.PORT || 8000),
  JWT_SECRET: process.env.JWT_SECRET || "ganti_rahasia_jwt",
  JWT_EXPIRES: process.env.JWT_EXPIRES || "7d",

  MYSQL_HOST: process.env.MYSQL_HOST || "127.0.0.1",
  MYSQL_PORT: Number(process.env.MYSQL_PORT || 3306),
  MYSQL_USER: process.env.MYSQL_USER || "root",
  MYSQL_PASSWORD: process.env.MYSQL_PASSWORD || "",
  MYSQL_DATABASE: process.env.MYSQL_DATABASE || "bot_wa",
};
