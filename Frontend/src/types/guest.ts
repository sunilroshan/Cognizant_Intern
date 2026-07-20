export interface GuestRequest {
  name: string;
  dob: string;
  contactInfoJSON: string;
  addressJSON: string;
  loyaltyTier: string;
  status?: string; 
}
