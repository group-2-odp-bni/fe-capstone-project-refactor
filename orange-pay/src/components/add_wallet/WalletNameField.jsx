import { useId } from "react";

export default function WalletNameField({ value, onChange, max = 10 }) {
  const id = useId();
  return (
    <div className="w-full">
      <label htmlFor={id} className="text-xs text-gray-600 block mb-1">
        Wallet name:
      </label>
      <div className="relative">
        <input
          id={id}
          type="text"
          value={value}
          onChange={(e) => {
            const v = e.target.value.slice(0, 10);
            onChange?.(v);
          }}
          placeholder="Ex: Shopping"
          className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:ring-2 focus:ring-gray-900/10 focus:border-gray-300"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-500">
          {value?.length ?? 0}/10
        </span>
      </div>
    </div>
  );
}
