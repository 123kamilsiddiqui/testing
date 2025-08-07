import { Link, useLocation } from "wouter";

const navigationItems = [
  { path: "/", label: "Main Page", id: "main" },
  { path: "/orders", label: "Add/Update Order", id: "orders" },
  { path: "/staff", label: "Staff/Billbook", id: "staff" },
  { path: "/entry-status", label: "Entry Status", id: "status" },
  { path: "/delivery", label: "Delivery", id: "delivery" },
  { path: "/google-sheets", label: "Google Sheets", id: "sheets" },
];

export function Navigation() {
  const [location] = useLocation();

  return (
    <nav className="bg-navy-medium shadow-lg">
      <div className="flex justify-center">
        {navigationItems.map((item) => {
          const isActive = location === item.path;
          return (
            <Link key={item.id} href={item.path}>
              <button
                className={`px-7 py-4 text-lg font-medium transition-all duration-200 ${
                  isActive
                    ? "nav-btn-active"
                    : "nav-btn-inactive hover:nav-btn-active"
                }`}
              >
                {item.label}
              </button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
