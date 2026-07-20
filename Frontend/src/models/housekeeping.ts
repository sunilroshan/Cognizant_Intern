export interface Housekeeping {
  hkId: number;
  roomId: number;
  roomNumber?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  cleaningStatus: string; // "NEEDS_CLEANING", "IN_PROGRESS", "CLEAN_READY"
}
