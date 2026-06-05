import { Link, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, CheckSquare, Bell, LogOut } from "lucide-react";

export default function Layout() {
  const location = useLocation();

  const navigation = [
    { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
    { name: "Tasks", path: "/tasks", icon: CheckSquare },
    { name: "Activity", path: "/activity", icon: Bell },
  ];

  return (
    <div className="flex min-h-screen bg-[#fff7fb]">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white border-r border-pink-100 p-6 flex flex-col justify-between hidden md:flex">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2 px-2 mb-8">
            <div className="h-8 w-8 rounded-xl bg-linear-to-tr from-pink-400 to-rose-400 flex items-center justify-center text-white font-bold text-sm">
              S
            </div>
            <span className="font-bold text-xl bg-linear-to-r from-pink-500 to-rose-500 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>

          {/* Nav Links */}
          <nav className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-pink-50 text-pink-600 shadow-xs"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                  }`}
                >
                  <Icon size={18} />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Logout Button */}
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all"
        >
          <LogOut size={18} />
          Logout
        </Link>
      </aside>

      {/* Main Content Dynamic Canvas */}
      <main className="flex-1 overflow-y-auto">
        {/* Mobile quick-nav helper */}
        <div className="md:hidden bg-white border-b border-pink-50 p-4 flex justify-around">
          {navigation.map((item) => (
            <Link 
              key={item.name} 
              to={item.path} 
              className={`text-xs font-medium px-3 py-1.5 rounded-xl ${location.pathname === item.path ? 'bg-pink-50 text-pink-600' : 'text-gray-500'}`}
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* Target route components mount here */}
        <Outlet />
      </main>
    </div>
  );
}