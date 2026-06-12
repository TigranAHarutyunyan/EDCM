import axios from "axios";

const api = axios.create({
    baseURL: "/api/",
    withCredentials: true,
    timeout: 10000,
    // Axios will read the CSRF cookie and set the header automatically for unsafe methods.
    xsrfCookieName: "csrftoken",
    xsrfHeaderName: "X-CSRFToken",
});

const getCookie = (name) => {
    if (typeof document === "undefined") return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return null;
};

let csrfPromise = null;
const ensureCsrfCookie = async () => {
    if (typeof document === "undefined") return;
    if (getCookie("csrftoken")) return;

    if (!csrfPromise) {
        csrfPromise = api.get("csrf/").finally(() => {
            csrfPromise = null;
        });
    }
    await csrfPromise;
};

api.interceptors.request.use(async (config) => {
    const method = config.method?.toLowerCase();
    if (method && ["post", "put", "patch", "delete"].includes(method)) {
        await ensureCsrfCookie();
    }
    return config;
});

export default api;
