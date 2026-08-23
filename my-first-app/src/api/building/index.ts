import api from "../client";
import type { BuildingDto, CreateBuildingPayload, UpdateBuildingPayload } from "../../types/building";
import type { ApiMessageResponse } from "../../types/common";

export const getBuildings = () => {
    return api.get<BuildingDto[]>("/Building");
};

export const getBuilding = (id: number) => {
    return api.get<BuildingDto>(`/Building/${id}`);
};

export const createBuilding = (data: CreateBuildingPayload) => {
    return api.post<BuildingDto>("/Building", data);
};

export const updateBuilding = (data: UpdateBuildingPayload) => {
    return api.put<ApiMessageResponse>("/Building", data);
};

export const deleteBuilding = (id: number) => {
    return api.delete<ApiMessageResponse>(`/Building/${id}`);
};
