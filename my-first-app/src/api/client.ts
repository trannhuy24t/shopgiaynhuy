import axios, { type AxiosError } from "axios";

export const getBaseApiUrl = (): string => {
    const envBase = import.meta.env.VITE_API_BASE_URL || "http://localhost:5141";
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        // Nếu điện thoại hoặc thiết bị khác kết nối qua IP mạng LAN (ví dụ 192.168.x.x)
        if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
            return envBase.replace(/localhost|127\.0\.0\.1/g, hostname);
        }
    }
    return envBase;
};

const api = axios.create({
    baseURL: `${getBaseApiUrl()}/api`,
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error);
        } else if (token) {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

api.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && originalRequest && !(originalRequest as any)._retry) {
            // Đã thử ở trang login hoặc endpoint refresh-token -> điều hướng về login ngay
            if (originalRequest.url?.includes("/Auth/login") || originalRequest.url?.includes("/Auth/refresh-token")) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            (originalRequest as any)._retry = true;

            const refreshToken = localStorage.getItem("refreshToken");
            const accessToken = localStorage.getItem("token");

            if (!refreshToken || !accessToken) {
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                })
                    .then((newToken) => {
                        originalRequest.headers.Authorization = `Bearer ${newToken}`;
                        return api(originalRequest);
                    })
                    .catch((err) => Promise.reject(err));
            }

            isRefreshing = true;

            try {
                const response = await axios.post(`${getBaseApiUrl()}/api/Auth/refresh-token`, {
                    accessToken,
                    refreshToken,
                });

                const { token: newAccessToken, refreshToken: newRefreshToken } = response.data;
                localStorage.setItem("token", newAccessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                api.defaults.headers.common.Authorization = `Bearer ${newAccessToken}`;
                originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

                processQueue(null, newAccessToken);
                return api(originalRequest);
            } catch (refreshErr) {
                processQueue(refreshErr, null);
                localStorage.removeItem("token");
                localStorage.removeItem("refreshToken");
                localStorage.removeItem("user");
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
                return Promise.reject(refreshErr);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export default api;

interface ApiErrorBody {
    message?: string;
}

// Backend luôn trả lỗi dạng { message: "..." } — dùng hàm này để lấy đúng message đó,
// không tự bịa message khác.
export function getApiErrorMessage(error: unknown, fallback = "Đã có lỗi xảy ra, vui lòng thử lại."): string {
    if (axios.isAxiosError<ApiErrorBody>(error)) {
        return error.response?.data?.message || fallback;
    }
    return fallback;
}

export function isForbiddenError(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 403;
}

export function isNotFoundError(error: unknown): boolean {
    return axios.isAxiosError(error) && error.response?.status === 404;
}

// Backend trả imageUrl dạng đường dẫn tương đối (VD: "/images/rooms/xxx.jpg") — phải ghép với
// domain backend (không phải domain FE) thì ảnh mới load được.
export function resolveImageUrl(url: string | null | undefined): string | undefined {
    if (!url) return undefined;
    
    // Nếu truy cập từ điện thoại qua IP mạng LAN, thay localhost thành IP đó để ảnh load được
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (hostname && hostname !== "localhost" && hostname !== "127.0.0.1") {
            url = url.replace(/https?:\/\/(localhost|127\.0\.0\.1)/g, `http://${hostname}`);
        }
    }

    if (/^https?:\/\//i.test(url)) return url;
    return `${getBaseApiUrl()}${url.startsWith("/") ? "" : "/"}${url}`;
}
