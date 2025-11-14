import React from "react";
import { useNavigate } from "react-router-dom";

const BackButton = ({ to }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    if (to) {
      navigate(to); // navigate to specific 
    } else {
      navigate(-1); // fallback to go back
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm transition-all"
      aria-label="Kembali"
    >
      &larr;
    </button>
  );
};

export default BackButton;
