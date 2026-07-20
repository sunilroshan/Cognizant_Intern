import API from "./api";

export const loginUser = async (data: any) => {
  const response = await API.post("/users/login", data);
  return response.data;
};

export const registerUser = async (data: any) => {
  const response = await API.post("/users/register", data);
  return response.data;
};
