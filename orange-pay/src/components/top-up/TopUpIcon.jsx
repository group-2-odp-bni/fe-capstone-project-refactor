export default function TopUpIcon({ size = 9, bgColor = "#FF9A25", icon = "+" }) {
  return (
    <div className="flex justify-center">
      <div
        className={`w-${size} h-${size} rounded-xl text-white grid place-items-center`}
        style={{ backgroundColor: bgColor }}
      >
        <span className="text-xl font-bold leading-none">{icon}</span>
      </div>
    </div>
  );
}
