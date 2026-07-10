import api from "../api/axios";

export const getCart = () => {
    return api.get("/Cart");
};

export const addToCart = (data) => {
    return api.post("/Cart/add", data);
};

export const updateCart = (data) => {
    return api.put("/Cart/update", data);
};

export const removeCart = (id) => {
    return api.delete(`/Cart/${id}`);
};

export const clearCart = () => {
    return api.delete("/Cart/clear");
};