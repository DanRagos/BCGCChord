import { io } from 'socket.io-client';

// A single shared socket for the whole app. Connecting to no explicit URL
// targets the current origin: in dev that's the Vite dev server, which
// proxies /socket.io to the API (see vite.config.js); in production
// Express serves both the API and the socket.io endpoint from the same
// origin as the built client. Lazily created so pages that never touch the
// Lineup live view never open a socket at all.
let socket = null;

export function getSocket() {
  if (!socket) {
    socket = io({ withCredentials: true, autoConnect: true });
  }
  return socket;
}
