import React from "react";
import { RouterProvider } from "react-router-dom";
import { AuthProvider } from "./AuthContext";
import { Toaster } from "react-hot-toast";
import router from "./routes/routes";
import "./styles/global.css";

export const App: React.FC = () => {
  return (
    <AuthProvider>
      {/* Toast notifications container */}
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
      
      {/* App router entry */}
      <RouterProvider router={router} />
    </AuthProvider>
  );
};

export default App;