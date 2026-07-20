import API from "./api";

export const generateInvoice = async (data: any) => {
  const response = await API.post("/api/invoices", data);
  return response.data;
};

export const getByGuest = async (guestId: number) => {
  const response = await API.get(`/api/invoices/guest/${guestId}`);
  return response.data;
};

export const getByReservation = async (reservationId: number) => {
  const response = await API.get(`/api/invoices/reservation/${reservationId}`);
  return response.data;
};
