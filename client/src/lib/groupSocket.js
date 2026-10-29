import { io } from "socket.io-client";

const groupSocket = io(import.meta.env.VITE_BASEURL || "http://localhost:4000", {
  autoConnect: false,
  path: "/socket.io",
  transports: ["websocket"],
});

export default groupSocket;
