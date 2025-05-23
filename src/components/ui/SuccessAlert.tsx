
import React from "react";

interface SuccessAlertProps {
  message: string;
}

const SuccessAlert: React.FC<SuccessAlertProps> = ({ message }) => {
  return (
    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
      <p className="font-bold">Success</p>
      <p>{message}</p>
    </div>
  );
};

export default SuccessAlert;
