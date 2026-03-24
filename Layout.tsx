import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  CreditCard, 
  Trophy, 
  BarChart3, 
  Menu, 
  X 
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const location = useLocation();

  const navItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Students', path: '/students', icon: Users },
    { name: 'Attendance', path: '/attendance', icon: CalendarCheck },
    { name: 'Fees', path: '/fees', icon: CreditCard },
    { name: 'Tournaments', path: '/tournaments', icon: Trophy },
    { name: 'Reports', path: '/reports', icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen flex bg-bg-dark">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 bg-card-dark border-r border-border-dark transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0",
          !isSidebarOpen && "-translate-x-full lg:hidden"
        )}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
              <Trophy className="text-black w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Maha Silambam</h1>
          </div>

          <nav className="flex-1 px-4 space-y-2 py-4">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all group",
                    isActive 
                      ? "bg-primary text-black font-semibold" 
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-5 h-5", isActive ? "text-black" : "group-hover:text-primary")} />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t border-border-dark">
            <div className="flex items-center gap-3 px-4 py-3">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                <Users className="w-4 h-4 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">Silambam Master</p>
                <p className="text-xs text-white/40 truncate">Admin Account</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-card-dark/50 backdrop-blur-md border-bottom border-border-dark flex items-center justify-between px-6 lg:hidden">
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-white/60 hover:text-white">
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold">Maha Silambam</h1>
          <div className="w-10" /> {/* Spacer */}
        </header>

        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
