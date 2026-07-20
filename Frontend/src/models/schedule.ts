import { ShiftType, StaffScheduleStatus } from "../types";
export type { ShiftType, StaffScheduleStatus };

export interface StaffSchedule {
  id: number;
  staffId: number;
  staffName?: string;
  shiftDate: string;
  startTime: string;
  endTime: string;
  shiftType: ShiftType;
  department: string;
  status: StaffScheduleStatus;
  notes?: string;
  assignedById?: number;
}
