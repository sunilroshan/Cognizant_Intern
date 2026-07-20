export type RoomStatus = "AVAILABLE" | "BOOKED" | "OCCUPIED" | "NEEDS_CLEANING" | "MAINTENANCE";

export interface Room {
  roomId: number;
  roomNumber: string;
  roomType: string;
  availabilityStatus: RoomStatus;
  ratePerNight: number;
  capacity: number;
  amenitiesJson?: string; // e.g. {"wifi":true,"tv":true,"ac":true}
}
