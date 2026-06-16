import React from "react";

export const STATUS_META = {
  draft:      { label: "Draft",      color: "#533AB7", bg: "#EEEDFE", classes: "text-[#533AB7] bg-[#EEEDFE]" },
  review:     { label: "In Review",  color: "#854F0B", bg: "#FAEEDA", classes: "text-[#854F0B] bg-[#FAEEDA]" },
  published:  { label: "Published",  color: "#0F6E56", bg: "#E1F5EE", classes: "text-[#0F6E56] bg-[#E1F5EE]" },
  superseded: { label: "Superseded", color: "#5F5E5A", bg: "#F1EFE8", classes: "text-[#5F5E5A] bg-[#F1EFE8]" },
  archived:   { label: "Archived",   color: "#5F5E5A", bg: "#D3D1C7", classes: "text-[#5F5E5A] bg-[#D3D1C7]" },
};

export default function Badge({ status }) {
  const m = STATUS_META[status] || STATUS_META.draft;
  return (
    <span className={`text-[10px] font-bold tracking-[0.06em] py-0.5 px-[9px] rounded-[20px] uppercase whitespace-nowrap ${m.classes}`}>
      {m.label}
    </span>
  );
}
