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
  status: string;
  fulfillmentDate?: string;
  createdAt?: string;
}