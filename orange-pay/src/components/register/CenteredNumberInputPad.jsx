import { Delete } from "lucide-react";

export default function CenteredNumberInputPad({ value, onChange }) {

  const handlePress = (num) => {
    if (value.length < 6) onChange(value + num);
  };

  const handleDelete = () => {
    onChange(value.slice(0, -1));
  };

  return (
    <div>
      {/* Centered input field */}
      <div className="flex flex-col items-center justify-center flex-1">
        <label htmlFor="pin" className="text-gray-500 mb-3 text-base">
          Masukkan PIN Anda
        </label>

        <input
          id="pin"
          type="password"
          value={value}
          readOnly
          placeholder="••••••"
          className="text-4xl text-center tracking-[1rem] bg-transparent outline-none font-semibold text-gray-800 w-52"
        />
      </div>

      {/* Number pad */}
      <div className="mt-10 mb-10 grid grid-cols-3 gap-y-4 text-center text-2xl font-medium text-gray-800">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handlePress(num.toString())}
            className="m-2 aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
          >
            {num}
          </button>
        ))}

        <div />

        <button
          type="button"
          onClick={() => handlePress("0")}
          className="m-2 aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="m-2 aspect-square rounded-full bg-gray-100 active:bg-gray-200 transition-all flex items-center justify-center"
        >
          <Delete className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
