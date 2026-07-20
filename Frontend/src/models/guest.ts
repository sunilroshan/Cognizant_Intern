export type LoyaltyTier = "PLATINUM" | "GOLD" | "SILVER";
export type GuestStatus = "ACTIVE" | "INACTIVE";

export interface Guest {
  guestId: number;
  name: string;
  dob: string;
  contactInfoJSON: string; // JSON String e.g. {"phone":"9876543210","email":"alice@gmail.com"}
  addressJSON: string;     // JSON String e.g. {"address":"123 Forest Hill, NY"}
  loyaltyTier: LoyaltyTier;
  status: GuestStatus;
  createdAt?: string;
}

export interface GuestRequest {
  name: string;
  dob: string;
  contactInfoJSON: string;
  addressJSON: string;
  loyaltyTier: string;
  status?: string;
}
