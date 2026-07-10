import api from "../api/axios";

export const checkout = (data) => {
    return api.post("/Order/checkout", data);
};

export const myOrders = () => {
    return api.get("/Order/my-orders");
};