import API from "./api";

export const createReservation = async (data: any) => {
  const response = await API.post("/api/reservations", data);
  return response.data;
};

export const getAllReservations = async () => {
  const response = await API.get("/api/reservations");
  return response.data;
};

export const getReservationById = async (id: number) => {
  const response = await API.get(`/api/reservations/${id}`);
  return response.data;
};

export const getReservationsByGuest = async (guestId: number) => {
  const response = await API.get(`/api/reservations/guest/${guestId}`);
  return response.data;
};

export const getAvailableRoomsForDates = async (checkIn: string, checkOut: string) => {
  const response = await API.get("/api/reservations/available-rooms", {
    params: { checkIn, checkOut },
  });
  return response.data;
};

export const updateReservation = async (id: number, data: any) => {
  const response = await API.put(`/api/reservations/${id}`, data);
  return response.data;
};

export const checkIn = async (id: number) => {
  const response = await API.put(`/api/reservations/${id}/check-in`);
  return response.data;
};

export const checkOut = async (id: number) => {
  const response = await API.put(`/api/reservations/${id}/check-out`);
  return response.data;
};

export const cancelReservation = async (id: number) => {
  const response = await API.put(`/api/reservations/${id}/cancel`);
  return response.data;
};
