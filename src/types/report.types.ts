export interface Report {
  _id?: string;
  tenantId?: string;
  title: string;
  description?: string;
  createdAt?: string;
}

export interface CreateReportDto {
  title: string;
  description?: string;
}
