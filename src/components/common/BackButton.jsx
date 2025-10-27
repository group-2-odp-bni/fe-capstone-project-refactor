import React from "react";
import { IoIosArrowBack } from "react-icons/io";

const BackButton = ({ onClick }) => {
  return (
    <button onClick={() => history.back()} className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 shadow-sm transition-all"
        aria-label="Kembali"
      >
         &larr;
      </button>
  );
};

export default BackButton;
