import api from "../client";
import type { SystemConfigDto, UpsertSystemConfigPayload, PublicRatesDto } from "../../types/systemConfig";

// Admin — chỉ Admin gọi được (SystemConfigController yêu cầu role Admin, kể cả GET)
export const getSystemConfigs = () => {
    return api.get<SystemConfigDto[]>("/SystemConfig");
};

export const upsertSystemConfig = (data: UpsertSystemConfigPayload) => {
    return api.put<SystemConfigDto>("/SystemConfig", data);
};

// Công khai, không cần đăng nhập — giá điện/nước tham khảo cho khách xem phòng/đăng ký thuê
export const getPublicRates = () => {
    return api.get<PublicRatesDto>("/SystemConfig/public-rates");
};
