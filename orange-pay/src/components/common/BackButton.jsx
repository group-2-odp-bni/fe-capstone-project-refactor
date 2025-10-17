import React from "react";
import { IoIosArrowBack } from "react-icons/io";

const BackButton = ({ onClick }) => {
  return (
    <header className="bg-[#FF9A25] h-36 w-full rounded-b-[28px] relative">
      <button
        onClick={() => history.back()}
        className="absolute left-4 top-4 h-9 w-9 rounded-lg bg-white/70 grid place-items-center text-slate-700 hover:bg-white"
        aria-label="Kembali"
      >
        ‹
      </button>
    </header>
  );
};

export default BackButton;
