"use client";

type CustomerNameFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function CustomerNameField({ value, onChange }: CustomerNameFieldProps) {
  return (
    <div className="mt-10 max-w-sm mx-auto">
      <label className="block font-sans text-xs tracking-widest uppercase font-bold text-ink-600 mb-2 text-center">
        your name *
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="who's this for?"
        required
        className="w-full bg-transparent border-0 border-b border-ink-400/40 focus:border-ink-900 focus:outline-none font-sans text-center text-ink-900 placeholder-ink-300 py-2"
      />
    </div>
  );
}
