export default function Button({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-lg h-11 px-4 font-medium text-white bg-slate-800 hover:bg-slate-900 disabled:opacity-60 disabled:cursor-not-allowed transition ${className}`}
    >
      {children}
    </button>
  );
}
