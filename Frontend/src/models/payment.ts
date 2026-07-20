export interface Payment {
  paymentID: number;
  invoiceID: number;
  guestID: number;
  amount: number;
  method: string; // CASH, CARD, UPI, NET_BANKING
  paymentDate?: string;
  status: string; // PENDING, COMPLETED, FAILED
}
