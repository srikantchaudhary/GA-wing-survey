import React from "react";

const BG_BY_TYPE = {
  success: "bg-[#0F6E56]",
  draft: "bg-[#533AB7]",
  review: "bg-[#854F0B]",
  error: "bg-[#A32D2D]",
};

export default function Toast({ msg, type, visible }) {
  return (
    <div
      className={`fixed bottom-7 left-1/2 -translate-x-1/2 text-white py-[11px] px-[22px] rounded-[10px] text-[13px] font-semibold z-[9999] transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] shadow-[0_8px_32px_rgba(0,0,0,0.18)] flex items-center gap-2 whitespace-nowrap pointer-events-none ${BG_BY_TYPE[type] || "bg-[#2C2C2A]"} ${visible ? "translate-y-0" : "translate-y-20"}`}
    >
      {msg}
    </div>
  );
}
