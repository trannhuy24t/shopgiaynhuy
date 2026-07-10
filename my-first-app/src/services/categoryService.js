import api from "../api/axios";

export const getCategories = () => {
    return api.get("/Category");
};