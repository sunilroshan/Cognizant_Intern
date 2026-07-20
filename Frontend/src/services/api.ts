import axios from "axios";
import { getToken } from "../utils/auth";

const API = axios.create({
  baseURL: "http://localhost:8090",
  timeout: 10000,
});

// Request Interceptor to automatically append JWT Token
API.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor for global error Handling/exceptions
API.interceptors.response.use(
  (response) => response,
  (error) => {
    // Standardize exception handling
    const status = error.response ? error.response.status : null;
    let message = "Network Error: Could not connect to HospEase backend.";

    if (error.response) {
      const data = error.response.data;
      if (typeof data === "string" && data.trim()) {
        message = data;
      } else if (data && data.message) {
        message = data.message;
      } else if (data && data.error) {
        message = data.error;
      } else {
        // We DID get a response from the backend, just no readable body.
        // Don't mislabel it as a network error.
        const statusText = error.response.statusText || "";
        message =
          status === 409
            ? `Conflict: this action isn't allowed in the record's current state${
                statusText ? ` (${statusText})` : ""
              }.`
            : `Request failed with status ${status}${
                statusText ? ` ${statusText}` : ""
              }.`;
      }

      // Authorization failures: the backend may report these as 403, 401, or
      // even a 500 wrapping Spring Security's "Access Denied". Surface a clear,
      // permission-focused message instead of a confusing server error.
      const looksLikeAccessDenied =
        /access\s*denied|forbidden|not\s*authorized|unauthorized/i.test(
          String(message)
        );
      if (status === 403 || status === 401 || looksLikeAccessDenied) {
        message =
          "You don't have permission to perform this action. Please sign in with an authorized account.";
      }
    }

    // Wrap the error inside a custom Error object or throw it
    const customError = new Error(message);
    (customError as any).status = status;
    (customError as any).originalError = error;

    return Promise.reject(customError);
  }
);

export default API;
