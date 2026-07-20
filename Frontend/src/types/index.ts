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

export type LoyaltyTier = "PLATINUM" | "GOLD" | "SILVER";
export type GuestStatus = "ACTIVE" | "INACTIVE";

export interface Guest {
  guestId: number;
  name: string;
  dob: string;
  contactInfoJSON: string; // JSON String e.g. {"contact": "1234567890"}
  addressJSON: string;     // JSON String e.g. {"address": "Street Name"}
  loyaltyTier: LoyaltyTier;
  status: GuestStatus;
  createdAt?: string;
}

export type RoomStatus = "AVAILABLE" | "BOOKED" | "OCCUPIED" | "NEEDS_CLEANING" | "MAINTENANCE";

export interface Room {
  roomId: number;
  roomNumber: string;
  roomType: string;
  availabilityStatus: RoomStatus;
}

export type ReservationStatus = "BOOKED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED";

export interface Reservation {
  resId: number;
  guestId: number;
  guestName?: string;
  roomId: number;
  roomNumber?: string;
  handledByStaffId?: number;
  handledByStaffName?: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  createdAt?: string;
  modifiedAt?: string;
}

export interface Housekeeping {
  hkId: number;
  roomId: number;
  roomNumber?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  cleaningStatus: string; // e.g. "needs cleaning", "cleaning in progress", "clean"
}

export interface Invoice {
  invoiceID: number;
  guestID: number;
  guestName?: string;
  reservationID: number;
  lineItemsJSON: string; // JSON String list of items
  totalAmount: number;
  currency: string;
  dueDate: string;
  invoiceURI?: string;
  status: string; // e.g. "PENDING", "PAID"
  createdAt?: string;
}

export interface Payment {
  paymentID: number;
  invoiceID: number;
  guestID: number;
  amount: number;
  method: string; // CASH, CARD, UPI, NET_BANKING
  paymentDate?: string;
}

export interface ServiceOrder {
  orderId: number;
  guestId: number;
  guestName?: string;
  roomId: number;
  roomNumber?: string;
  assignedStaffId?: number;
  assignedStaffName?: string;
  serviceType: string;
  detailsJson: string; // JSON details
  price: number;
  fulfilled: boolean;
  fulfillmentDate?: string;
}

export interface Staff {
  staffId: number;
  userId: number;
  userEmail?: string;
  userFullName?: string;
  role: Roles;
  department: string;
  contactInfoJson: string; // JSON string
  status: string; // ACTIVE, INACTIVE
}

export type ShiftType = "MORNING" | "AFTERNOON" | "NIGHT" | "CUSTOM";
export type StaffScheduleStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

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
  assignedByName?: string;
}

export type ReportScope = "OCCUPANCY" | "FINANCE" | "STAFF";

export interface Report {
  id: number;
  scope: ReportScope;
  parametersJson: string;
  generatedBy: string;
  generatedAt: string;
}
