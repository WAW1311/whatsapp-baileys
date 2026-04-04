/** Singleton to share the Socket.io instance between server.js and Next.js API routes */
let _io = null;

export function setIo(io) {
  _io = io;
}

export function getIo() {
  return _io;
}
