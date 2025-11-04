export default function FormLabel({ children, htmlFor }) {
  return (
    <p
      className="block text-sm font-medium text-gray-700 mb-2"
    >
      {children}
    </p>
  );
}
