export type Roles =
  | "ADMIN"
  | "GUEST"
  | "HOUSEKEEPING_STAFF"
  | "FRONTDESK_STAFF"
  | "SERVICE_STAFF"
  | "FINANCE_OFFICER"
  | "MANAGER"
  | "AUDITOR"
  | "USER";

export interface User {
  userId: number;
  email: string;
  fullName: string;
  address?: string;
  phoneNo?: string;
  role: Roles;
}
