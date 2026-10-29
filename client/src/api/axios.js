import axios from "axios";

const api = axios.create({
    baseURL:(import.meta.env.VITE_BASEURL || "https://poster-a.vercel.app")
})

export default api