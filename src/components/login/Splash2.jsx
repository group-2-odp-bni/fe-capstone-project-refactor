import BrandLogo from "../common/BrandLogo";
import Button from "../common/Button";

export default function Splash2({ onBack, onLogin, onGoRegister }) {
  return (
    <div className="relative min-h-full bg-white flex flex-col justify-center items-center p-4">
      <button
        onClick={onBack}
        className="absolute left-4 top-4 bg-white/70 rounded-full px-3 py-1"
      >
        ←
      </button>
      <div className="w-full max-w-sm bg-white rounded-2xl p-6">
        <div className="flex flex-col items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2 text-center">
            Selamat Datang di OrangePay!
          </h2>
          <p className="text-center text-gray-500 text-sm">
            Dompet mudah dan interaktif untuk kamu!
          </p>
          <div className="my-10">
            <BrandLogo />
          </div>
        </div>
        <Button
          className="w-full !bg-orange-500 hover:!bg-orange-600"
          onClick={onLogin}
        >
          Login
        </Button>
        <div className="text-center mt-5 text-gray-700">
          Tidak punya akun?{" "}
          <button
            className="text-orange-600 font-semibold underline"
            onClick={onGoRegister}
          >
            Daftar
          </button>
        </div>
      </div>
    </div>
  );
}
