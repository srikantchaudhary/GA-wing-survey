import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function AdminSidebar({ activePage }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(() => {
    const saved = localStorage.getItem('adminSidebarCollapsed');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('adminSidebarCollapsed', collapsed);
  }, [collapsed]);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: "📊", path: "/admin/dashboard" },
    { id: "admin", label: "Form Management", icon: "🛠", path: "/admin" },
    { id: "static-forms", label: "DA cadre & MCA/MKI Report", icon: "📋", path: "/admin/static-forms" },
  ];

  const handleItemClick = (path) => {
    navigate(path);
    setCollapsed(true);
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  if (collapsed) {
    return (
      <div className="w-14 bg-white border-r border-[#E8E6DF] flex flex-col items-center py-4 gap-4 h-[calc(100vh-60px)]">
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
            onClick={() => handleItemClick(item.path)}
            className={`w-9 h-9 flex items-center justify-center rounded-lg cursor-pointer border-none text-lg ${
              location.pathname === item.path || (item.id === "admin" && location.pathname.startsWith("/admin") && location.pathname !== "/admin/dashboard" && location.pathname !== "/admin/static-forms")
                ? "bg-[#E6F1FB] text-[#185FA5]"
                : "text-[#2C2C2A] hover:bg-[#E6F1FB] transition-colors"
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
    <aside className="w-52 bg-white border-r border-[#E8E6DF] p-5 flex flex-col gap-2 h-[calc(100vh-60px)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[11px] font-bold tracking-[0.1em] uppercase text-[#B4B2A9]">Admin Navigation</div>
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
          onClick={() => handleItemClick(item.path)}
          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-left text-sm font-medium cursor-pointer border-none ${
            location.pathname === item.path || (item.id === "admin" && location.pathname.startsWith("/admin") && location.pathname !== "/admin/dashboard" && location.pathname !== "/admin/static-forms")
              ? "bg-[#E6F1FB] text-[#185FA5]"
              : "text-[#2C2C2A] hover:bg-[#E6F1FB] transition-colors"
          }`}
        >
          <span className="text-base">{item.icon}</span>
          {item.label}
        </button>
      ))}
    </aside>
  );
}
