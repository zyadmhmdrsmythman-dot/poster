let socketServer;

export const setGroupSocketServer = (io) => {
  socketServer = io;
};

export const getSocketServer = () => socketServer;

export const emitGlobalEvent = (event, payload) => {
  if (!socketServer) return;
  try {
    socketServer.emit(event, payload);
  } catch (error) {
    console.error("Socket emitGlobalEvent error:", error.message);
  }
};

export const emitGroupEvent = (groupId, event, payload) => {
  if (!socketServer) {
    throw new Error("Group Socket.IO server is not initialized");
  }

  socketServer.to(String(groupId)).emit(event, payload);
};

export const emitUserEvent = (userId, event, payload) => {
  if (!socketServer) {
    throw new Error("Group Socket.IO server is not initialized");
  }

  socketServer.to(`user:${String(userId)}`).emit(event, payload);
};
