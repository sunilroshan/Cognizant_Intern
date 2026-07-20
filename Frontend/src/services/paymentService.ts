import API from "./api";

export const recordManualPayment = async (data: any) => {
  const response = await API.post("/api/payments/manual", data);
  return response.data;
};
