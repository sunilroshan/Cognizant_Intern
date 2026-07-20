import axios from "axios";

const API = "/api/admin/service-orders";

export const getAllServiceOrders = async (status?: string, search?: string) => {
  const res = await axios.get("/api/admin/service-orders", {
    params: { status, search },
  });


  return res.data;
};


export const assignStaffToOrder = (id: number) =>
  axios.put(`${API}/${id}/assign`);

export const updateServiceOrderStatus = (id: number, status: string) =>
  axios.put(`${API}/${id}/status`, { status });
