import { Roles } from "./users";

export interface Staff {
  staffId: number;
  userId: number;
  userName?: string;
  role: string;
  contactInfoJson: string; // JSON String e.g. {"phone":"9876543212","email":"john@hospease.com"}
  status: string; // ACTIVE, INACTIVE
  createdAt?: string;
  updatedAt?: string;
}
