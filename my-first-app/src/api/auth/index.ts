import api from "../client";
import type { AuthUser } from "../../types/auth";

export interface LoginPayload {
    email: string;
    password: string;
}

export interface RegisterPayload {
    fullName: string;
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    token: string;
    user: AuthUser;
}

export const login = (data: LoginPayload) => {
    return api.post<LoginResponse>("/Auth/login", data);
};

export const register = (data: RegisterPayload) => {
    return api.post<{ message: string }>("/Auth/register", data);
};
