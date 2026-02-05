export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  pages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data: T;
  pagination?: PaginationInfo;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  error: {
    code: string;
    details?: any;
  };
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'asc' | 'desc';
  search?: string;
  [key: string]: any;
}
