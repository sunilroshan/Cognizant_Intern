import { ReservationStatus } from "../types";

export interface Reservation {
  resId: number;
  guestId: number;
  guestName?: string;
  roomId: number;
  roomNumber?: string;
  checkInDate: string;
  checkOutDate: string;
  status: ReservationStatus;
  numberOfGuests: number;
  createdAt?: string;
  modifiedAt?: string;
}
