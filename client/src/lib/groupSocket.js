import { io } from "socket.io-client";

const groupSocket = io((import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app") || "http://localhost:4000", {
  autoConnect: false,
  path: "/socket.io",
  transports: ["polling", "websocket"],
  reconnectionAttempts: 5,
  timeout: 10000,
});

export default groupSocket;
