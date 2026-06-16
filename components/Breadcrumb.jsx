import { useLocation, Link } from "react-router-dom";

export default function Breadcrumb() {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    
    const breadcrumbMap = {
      'admin': { label: 'Admin Portal', path: '/admin' },
      'officer': { label: 'Officer Portal', path: '/officer' },
      'forms': { label: 'Forms', path: null }
    };

    const breadcrumbs = [{ label: 'Home', path: '/' }];

    let currentPath = '';
    pathnames.forEach((name, index) => {
      currentPath += `/${name}`;
      
      if (breadcrumbMap[name]) {
        breadcrumbs.push({
          label: breadcrumbMap[name].label,
          path: breadcrumbMap[name].path || currentPath
        });
      } else if (index === pathnames.length - 1) {
        // Last segment - could be a form ID or state name
        breadcrumbs.push({
          label: name,
          path: null
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <nav className="flex items-center gap-2 text-xs text-[#888780]">
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center gap-2">
          {index > 0 && <span className="text-[#D3D1C7]">›</span>}
          {crumb.path ? (
            <Link
              to={crumb.path}
              className="text-[#185FA5] no-underline font-medium transition-colors duration-150 hover:text-[#0F6E56]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span className="text-[#2C2C2A] font-semibold">{crumb.label}</span>
          )}
        </div>
      ))}
    </nav>
  );
}
