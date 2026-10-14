import React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

export default function Toast({ toast, onClose }) {
  if (!toast) return null;

  const { type = "info", message, title } = toast;

  const getIcon = () => {
    switch (type) {
      case "success":
        return <CheckCircle className="toast-icon text-success" size={20} />;
      case "error":
        return <AlertCircle className="toast-icon text-danger" size={20} />;
      default:
        return <Info className="toast-icon text-info" size={20} />;
    }
  };

  return (
    <div className={`toast-container toast-${type}`}>
      {getIcon()}
      <div className="toast-content">
        {title && <h4 className="toast-title">{title}</h4>}
        <p className="toast-message">{message}</p>
      </div>
      <button className="toast-close-btn" onClick={onClose}>
        <X size={16} />
      </button>
    </div>
  );
}
