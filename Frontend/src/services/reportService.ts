import API from "./api";

export const createReport = async (data: any) => {
  const response = await API.post("/api/reports", data);
  return response.data;
};

export const getAllReports = async () => {
  const response = await API.get("/api/reports");
  return response.data;
};

export const getReport = async (id: number) => {
  const response = await API.get(`/api/reports/${id}`);
  return response.data;
};
