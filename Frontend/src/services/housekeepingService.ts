import API from "./api";

// Normalize a raw housekeeping record from the backend so the UI can always
// rely on `hkId`, regardless of which id field name the API uses.
const normalizeRecord = (r: any) => {
  if (!r || typeof r !== "object") return r;
  const hkId =
    r.hkId ?? r.id ?? r.housekeepingId ?? r.hk_id ?? r.housekeeping_id;
  return { ...r, hkId };
};

export const addRecord = async (data: any) => {
  const response = await API.post("/api/housekeeping", data);
  return normalizeRecord(response.data);
};

export const getAllRecords = async () => {
  const response = await API.get("/api/housekeeping");
  const data = response.data;
  return Array.isArray(data) ? data.map(normalizeRecord) : data;
};

export const updateStatus = async (id: number, data: any) => {
  if (id === undefined || id === null) {
    throw new Error("Cannot update housekeeping task: missing record id.");
  }
  const response = await API.put(`/api/housekeeping/${id}`, data);
  return normalizeRecord(response.data);
};
