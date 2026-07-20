import React from "react";
import { AlertCircle } from "lucide-react";
import "./Headsup.css";

interface HeadsupProps {
  message: string;
  type?: "info" | "warning" | "error";
}

export const Headsup: React.FC<HeadsupProps> = ({ message, type = "info" }) => {
  return (
    <div className={`headsup headsup-${type}`}>
      <AlertCircle size={16} />
      <span>{message}</span>
    </div>
  );
};

export default Headsup;
