import { BaseService } from './base.service';
import { Report, CreateReportDto } from '@/types/report.types';

class ReportService extends BaseService<Report, CreateReportDto> {
  constructor() {
    super('/reports');
  }

  // Example method to generate a PDF report
  async generate(reportId: string) {
    const response = await this.getById(reportId);
    return response;
  }
}

export const reportService = new ReportService();
