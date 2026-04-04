/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow Next.js to work with the custom Socket.io server
  serverExternalPackages: [
    '@whiskeysockets/baileys',
    'baileys-antiban',
    'pino',
    '@hapi/boom',
    'sharp',
  ],
};

module.exports = nextConfig;
