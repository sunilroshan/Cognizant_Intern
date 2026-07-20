import API from "./api";

export const createOrder = async (data: any) => {
  const response = await API.post("/api/orders", data);
  return response.data;
};

export const fulfillOrder = async (orderId: number) => {
  const response = await API.put(`/api/orders/${orderId}/fulfill`);
  return response.data;
};

export const getOrder = async (orderId: number) => {
  const response = await API.get(`/api/orders/${orderId}`);
  return response.data;
};

export const getOrdersByGuest = async (guestId: number) => {
  const response = await API.get(`/api/orders/guest/${guestId}`);
  return response.data;
};

export const getServiceTypes = async () => {
  const response = await API.get(`/api/orders/service-types`);
  return response.data;
};

export const getAdminOrders = async (params?: { status?: string; staffId?: number; search?: string }) => {
  const query = new URLSearchParams();
  if (params?.status) query.append('status', params.status);
  if (params?.staffId) query.append('staffId', String(params.staffId));
  if (params?.search) query.append('search', params.search);

  const url = `/api/admin/service-orders` + (Array.from(query).length ? `?${query.toString()}` : '');
  const response = await API.get(url);
  return response.data;
};

export const adminAssignStaff = async (orderId: number, staffId: number) => {
  const response = await API.put(`/api/admin/service-orders/${orderId}/assign`, { staffId });
  return response.data;
};

export const adminUpdateStatus = async (orderId: number, status: string) => {
  const response = await API.put(`/api/admin/service-orders/${orderId}/status`, { status });
  return response.data;
};

export const updateOrder = async (orderId: number, data: any) => {
  const response = await API.put(`/api/orders/${orderId}`, data);
  return response.data;
};

export const cancelOrder = async (orderId: number) => {
  const response = await API.put(`/api/orders/${orderId}/cancel`);
  return response.data;
};