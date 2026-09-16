const { Server } = require('socket.io');

function roomName(lineupId) {
  return `lineup:${lineupId}`;
}

// Powers the Lineup "live" view: everyone viewing the same lineup joins a
// room keyed by lineupId, and whoever scrolls to a song/section broadcasts
// that position so every other connected viewer follows along.
function initSocketService(httpServer, corsOrigin) {
  const io = new Server(httpServer, { cors: { origin: corsOrigin, credentials: true } });

  io.on('connection', (socket) => {
    let joinedRoom = null;

    socket.on('lineup:join', ({ lineupId } = {}) => {
      if (!lineupId) return;
      if (joinedRoom) socket.leave(joinedRoom);
      joinedRoom = roomName(lineupId);
      socket.join(joinedRoom);
    });

    socket.on('lineup:scrollTo', (payload = {}) => {
      if (!joinedRoom) return;
      socket.to(joinedRoom).emit('lineup:scrollTo', {
        songId: payload.songId,
        sectionIndex: payload.sectionIndex,
        lineIndex: payload.lineIndex,
      });
    });
  });

  return io;
}

module.exports = { initSocketService, roomName };
