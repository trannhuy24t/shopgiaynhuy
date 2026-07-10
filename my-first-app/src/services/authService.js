import api from "../api/axios";

export const login = (data) => {
    return api.post("/Auth/login", data);
};

export const register = (data) => {
    return api.post("/Auth/register", data);
};