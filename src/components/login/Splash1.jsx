import BrandLogo from "../common/BrandLogo";

export default function Splash1({ onNext }) {
  return (
    <div
      className="min-h-full w-full flex items-center justify-center bg-white select-none"
      onClick={onNext}
      onTouchEnd={onNext}
    >
      <div className="flex flex-col items-center">
        <BrandLogo />
        <p className="text-gray-500 text-sm mt-16">
          Geser / Tap untuk lanjut →
        </p>
      </div>
    </div>
  );
}
