import axios, { type AxiosError } from "axios";

const api = axios.create({
    baseURL: `${import.meta.env.VITE_API_BASE_URL}/api`,
});

api.interceptors.request.use((config) => {

    const token = localStorage.getItem("token");

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
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
    if (/^https?:\/\//i.test(url)) return url;
    return `${import.meta.env.VITE_API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
}
