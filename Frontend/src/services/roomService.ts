import API from "./api";

const normalizeRoomList = (raw: any) => {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.data)) return raw.data;
  if (Array.isArray(raw?.content)) return raw.content;
  if (Array.isArray(raw?.items)) return raw.items;
  if (Array.isArray(raw?.results)) return raw.results;
  return [];
};

export const addRoom = async (data: any) => {
  const response = await API.post("/api/rooms", data);
  return response.data;
};

export const getAllRooms = async () => {
  const response = await API.get("/api/rooms");
  return normalizeRoomList(response.data);
};

export const getAvailableRooms = async () => {
  const response = await API.get("/api/rooms/available");
  return normalizeRoomList(response.data);
};

export const updateRoom = async (id: number, data: any) => {
  const response = await API.put(`/api/rooms/${id}`, data);
  return response.data;
};

export const deleteRoom = async (id: number) => {
  const response = await API.delete(`/api/rooms/${id}`);
  return response.data;
};
