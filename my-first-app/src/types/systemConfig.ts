export interface SystemConfigDto {
  id: number;
  key: string;
  value: string;
  description?: string | null;
}

export interface UpsertSystemConfigPayload {
  key: string;
  value: string;
  description?: string | null;
}

export interface PublicRatesDto {
  electricUnitPrice: number;
  waterUnitPrice: number;
}
