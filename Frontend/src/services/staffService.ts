import API from "./api";

export const createStaff = async (data: any) => {
  const response = await API.post("/api/staff", data);
  return response.data;
};

export const getAllStaff = async () => {
  const response = await API.get("/api/staff");
  return response.data;
};

export const getStaff = async (id: number) => {
  const response = await API.get(`/api/staff/${id}`);
  return response.data;
};

export const updateStaff = async (id: number, data: any) => {
  const response = await API.put(`/api/staff/${id}`, data);
  return response.data;
};

export const deleteStaff = async (id: number) => {
  const response = await API.delete(`/api/staff/${id}`);
  return response.data;
};
