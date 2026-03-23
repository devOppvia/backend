let io = null;

const admins = new Set();

const companyConnections = {};  

function initSocket(server) {
  io = require("socket.io")(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    
    socket.on("register_admin", () => {
      admins.add(socket.id);
    });

    socket.on("register_company", (companyId) => {
      if (!companyConnections[companyId]) {
        companyConnections[companyId] = [];
      }
      companyConnections[companyId].push(socket.id);
    });

    socket.on("join_support", (supportId) => {
      socket.join(supportId);
    });

    socket.on("disconnect", () => {
      admins.delete(socket.id);

      for (let companyId in companyConnections) {
        companyConnections[companyId] =
          companyConnections[companyId].filter((id) => id !== socket.id);
      }
    });
  });

  return io;
}

function getIo() {
  return io;
}

module.exports = {
  initSocket,
  getIo,
  admins,
  companyConnections,
};
