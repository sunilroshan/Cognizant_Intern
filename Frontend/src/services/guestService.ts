import API from "./api";
import { GuestRequest } from "../models/guest";

export const createGuest = async (data: GuestRequest) => {
  const response = await API.post("/guests", data);
  return response.data;
};

export const getAllGuests = async () => {
  const response = await API.get("/guests");
  return response.data;
};

export const getGuestById = async (id: number) => {
  const response = await API.get(`/guests/${id}`);
  return response.data;
};

export const updateGuest = async (id: number, data: GuestRequest) => {
  const response = await API.put(`/guests/${id}`, data);
  return response.data;
};

export const deleteGuest = async (id: number) => {
  const response = await API.delete(`/guests/${id}`);
  return response.data;
};
