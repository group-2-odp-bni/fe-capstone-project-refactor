export function FullActionButton({ children, onClick }) {
  return (
    <div className="flex justify-center mt-4">
      <button
        type="button"
        onClick={onClick}
        className="focus:outline-none inline-flex items-center justify-center
                   text-white bg-[#305856] hover:bg-[#2b3f42] focus:ring-4
                   focus:ring-[#305856]/30 font-medium rounded-lg text-sm
                   px-5 py-2.5 w-64 transition-all duration-200"
      >
        {children}
      </button>
    </div>
  );
}
