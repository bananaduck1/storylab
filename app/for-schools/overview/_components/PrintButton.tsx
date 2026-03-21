"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center rounded-[3px] border border-[#C0D9CB] px-4 py-2 text-sm font-medium text-[#1A2E26] hover:border-[#2C4A3E] transition-colors"
    >
      Print / Save as PDF
    </button>
  );
}
