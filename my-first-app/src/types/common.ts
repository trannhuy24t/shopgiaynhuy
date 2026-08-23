export interface PagedResult<T> {
  totalItems: number;
  page: number;
  pageSize: number;
  totalPages: number;
  items: T[];
}

export interface ApiMessageResponse {
  message: string;
}
