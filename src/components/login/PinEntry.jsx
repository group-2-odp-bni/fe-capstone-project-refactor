export default function PinEntry({ pin, error, onInput, onDelete }) {
  const items = [
    { value: "1", letters: "" },
    { value: "2", letters: "ABC" },
    { value: "3", letters: "DEF" },
    { value: "4", letters: "GHI" },
    { value: "5", letters: "JKL" },
    { value: "6", letters: "MNO" },
    { value: "7", letters: "PQRS" },
    { value: "8", letters: "TUV" },
    { value: "9", letters: "WXYZ" },
  ];
  return (
    <>
      <div className="flex flex-col items-center mt-5">
        <h2 className="text-black text-lg mb-6">Masukkan PIN</h2>
        <div className="flex space-x-3 my-6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full ${
                pin.length > i
                  ? "bg-orange-500"
                  : "bg-white outline outline-2 outline-gray-400"
              }`}
            />
          ))}
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div className="mt-2 w-full bg-white p-5 rounded-t-xl shadow-lg">
        <div className="grid grid-cols-3 gap-6 justify-items-center text-gray-800">
          {items.map((k) => (
            <button
              key={k.value}
              onClick={() => onInput(k.value)}
              className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95"
            >
              {k.value}
              <div className="text-[10px] mt-1">{k.letters}</div>
            </button>
          ))}
          <button
            onClick={() => {}}
            disabled={pin.length < 6}
            className={`w-20 h-20 rounded-full text-2xl font-semibold shadow-lg active:scale-95
              ${
                pin.length === 6
                  ? "bg-[#305856] text-white"
                  : "bg-gray-300 text-gray-600"
              }`}
            title={pin.length === 6 ? "Enter" : "Isi PIN 6 digit"}
          >
            ✓
          </button>
          <button
            onClick={() => onInput("0")}
            className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95"
          >
            0
          </button>
          <button
            onClick={onDelete}
            className="w-20 h-20 rounded-full bg-gray-100 text-2xl font-semibold shadow-lg hover:bg-gray-200 active:scale-95"
          >
            ⌫
          </button>
        </div>
      </div>
    </>
  );
}
