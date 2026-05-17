let io;

function initSocket(serverIo) {
  io = serverIo;
}

function emitToUser(userId, event, payload) {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(event, payload);
}

function emitToHackathon(hackathonId, event, payload) {
  if (!io || !hackathonId) return;
  io.to(`hackathon:${hackathonId}`).emit(event, payload);
}

module.exports = { initSocket, emitToUser, emitToHackathon };
