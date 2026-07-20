export const setToken = (token: string) => {
  localStorage.setItem("token", token);
};

export const getToken = () => {
  return localStorage.getItem("token") || "";
};

export const removeToken = () => {
  localStorage.removeItem("token");
};

export const setRole = (role: string) => {
  localStorage.setItem("role", role);
};

export const getRole = () => {
  return localStorage.getItem("role") || "";
};

export const removeRole = () => {
  localStorage.removeItem("role");
};

export const setUserInfo = (userInfo: any) => {
  localStorage.setItem("userInfo", JSON.stringify(userInfo));
};

export const getUserInfo = () => {
  const info = localStorage.getItem("userInfo");
  if (!info) return null;
  try {
    return JSON.parse(info);
  } catch {
    return null;
  }
};

export const removeUserInfo = () => {
  localStorage.removeItem("userInfo");
};

export const clearAuth = () => {
  removeToken();
  removeRole();
  removeUserInfo();
};