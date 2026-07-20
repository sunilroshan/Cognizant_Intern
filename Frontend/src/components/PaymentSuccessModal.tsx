import React from "react";
import { Check } from "lucide-react";
import "./PaymentSuccessModal.css";

interface PaymentSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  currency: string;
}

export const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  isOpen,
  onClose,
  amount,
  currency,
}) => {
  if (!isOpen) return null;

  return (
    <div className="payment-modal-overlay">
      <div className="payment-modal-card">
        <div className="payment-modal-badge">
          <Check size={28} />
        </div>
        <h3>Payment Successful</h3>
        <p>Your transaction has been recorded. The corresponding invoice has been marked as settled.</p>
        
        <div className="payment-modal-amount">
          {amount.toFixed(2)} {currency}
        </div>

        <button onClick={onClose} className="payment-modal-btn">
          Back to billing
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
