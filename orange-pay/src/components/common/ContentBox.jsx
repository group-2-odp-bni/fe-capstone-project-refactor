export default function ContentBox({ children, className = "" }) {
  return (
    <div className={`p-5 rounded-2xl ml-2 mr-2 ${className}`}>
      {children}
    </div>
  );
}
