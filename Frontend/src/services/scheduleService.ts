import API from "./api";

const normalizeSchedule = (record: any) => {
  if (!record || typeof record !== "object") return record;
  const id =
    record.id ??
    record.scheduleId ??
    record.staffScheduleId ??
    record.staff_schedule_id ??
    record.schedule_id;
  return { ...record, id };
};

const normalizeScheduleList = (raw: any) => {
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.data)
    ? raw.data
    : Array.isArray(raw?.content)
    ? raw.content
    : Array.isArray(raw?.items)
    ? raw.items
    : [];
  return list.map(normalizeSchedule);
};

export const createSchedule = async (data: any) => {
  const response = await API.post("/api/staff-schedules", data);
  return normalizeSchedule(response.data);
};

export const getAllSchedules = async () => {
  const response = await API.get("/api/staff-schedules");
  return normalizeScheduleList(response.data);
};

export const getSchedule = async (id: number) => {
  const response = await API.get(`/api/staff-schedules/${id}`);
  return normalizeSchedule(response.data);
};

export const getSchedulesByStaff = async (staffId: number) => {
  const response = await API.get(`/api/staff-schedules/staff/${staffId}`);
  return normalizeScheduleList(response.data);
};

export const updateSchedule = async (id: number, data: any) => {
  const response = await API.put(`/api/staff-schedules/${id}`, data);
  return normalizeSchedule(response.data);
};

export const deleteSchedule = async (id: number) => {
  const response = await API.delete(`/api/staff-schedules/${id}`);
  return response.data;
};
