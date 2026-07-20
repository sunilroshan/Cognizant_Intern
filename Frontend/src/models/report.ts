import { ReportScope } from "../types";
export type { ReportScope };

export interface Report {
  reportId: number;
  scope: ReportScope;
  parametersJson: string; // JSON e.g. {"startDate":"...","endDate":"..."}
  metricsJson: string;     // JSON e.g. {"occupancyRate":50.0}
  generatedBy: string;
  generatedAt: string;
  reportUri?: string;
}
