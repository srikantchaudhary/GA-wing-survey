import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function OfficerSidebar({ activePage, onPageChange }) {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('officerSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('officerSidebarCollapsed', collapsed);
  }, [collapsed]);

  const menuItems = [
    { id: "pending-forms", label: "Pending Forms", icon: "📋", color: "#185FA5" },
    { id: "static-forms", label: "DA cadre & MCA/MKI", icon: "📄", color: "#0F6E56" },
    // { id: "static-report", label: "Static Report", icon: "📊", color: "#854F0B" },
  ];

  const handleItemClick = (pageId) => {
    onPageChange(pageId);
    setCollapsed(true);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  if (collapsed) {
    return (
      <div className="w-14 bg-white border-r border-[#E8E6DF] flex flex-col items-center py-4 gap-4 h-[calc(100vh-120px)]">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[#E6F1FB] transition-colors cursor-pointer border-none text-lg"
          title="Expand menu"
        >
          ☰
        </button>
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => handleItemClick(item.id)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none text-lg transition-colors ${
              activePage === item.id
                ? "bg-[#E6F1FB] text-[#185FA5]"
                : "text-[#2C2C2A] hover:bg-[#E6F1FB]"
            }`}
            title={item.label}
          >
            {item.icon}
          </button>
        ))}
      </div>
    );
  }

  return (
    <aside className="w-52 bg-white border-r border-[#E8E6DF] p-5 flex flex-col gap-2 h-[calc(100vh-120px)] overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9]">Officer Portal</div>
        <button
          onClick={toggleSidebar}
          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#E6F1FB] transition-colors cursor-pointer border-none text-sm"
          title="Collapse menu"
        >
          ×
        </button>
      </div>
      {menuItems.map(item => (
        <button
          key={item.id}
          onClick={() => handleItemClick(item.id)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium cursor-pointer border-none transition-colors ${
            activePage === item.id
              ? "bg-[#E6F1FB] text-[#185FA5]"
              : "text-[#2C2C2A] hover:bg-[#E6F1FB]"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </aside>
  );
}
