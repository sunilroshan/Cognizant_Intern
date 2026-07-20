export interface Invoice {
  invoiceID: number;
  guestID: number;
  guestName?: string;
  reservationID: number;
  lineItemsJSON: string; 
  totalAmount: number;
  currency: string;
  dueDate: string;
  invoiceURI?: string;
  status: string; 
  issuedAt?: string;
}
