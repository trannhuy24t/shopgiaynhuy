import api from "../api/axios";

export const getDashboard = () => {
    return api.get("/Dashboard");
};