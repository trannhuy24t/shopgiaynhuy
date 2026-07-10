import api from "../api/axios";

export const getProducts = () => {
    return api.get("/Product");
};

export const getProduct = (id) => {
    return api.get(`/Product/${id}`);
};

export const searchProduct = (params) => {
    return api.get("/Product/search", {
        params
    });
};