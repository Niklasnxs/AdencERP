import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { 
  LayoutDashboard, 
  Clock, 
  Calendar, 
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  highlight?: boolean;
}

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      label: 'Übersicht',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Zeiterfassung',
      path: '/zeiterfassung',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'Kalender',
      path: '/kalender',
      icon: <Calendar className="w-5 h-5" />,
    },
    {
      label: 'Benutzer',
      path: '/benutzer',
      icon: <Users className="w-5 h-5" />,
      adminOnly: true,
    },
    {
      label: 'Kunden',
      path: '/kunden',
      icon: <Users className="w-5 h-5" />,
      adminOnly: true,
    },
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#1e3a8a] text-white px-4 py-3 flex items-center justify-between border-b border-blue-700">
        <div>
          <h1 className="text-xl font-bold">AdencERP</h1>
          <p className="text-xs text-blue-200">TimeTrack</p>
        </div>
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-40',
          'w-64 bg-[#1e3a8a] text-white flex flex-col',
          'transition-transform duration-300 ease-in-out',
          'lg:translate-x-0',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full',
          'lg:h-screen h-full'
        )}
      >
        <div className="p-6 border-b border-blue-700 lg:block hidden">
          <h1 className="text-2xl font-bold">AdencERP</h1>
          <p className="text-sm text-blue-200 mt-1">TimeTrack & Attendance</p>
        </div>

        {/* Mobile Header inside sidebar */}
        <div className="p-6 border-b border-blue-700 lg:hidden">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">AdencERP</h1>
              <p className="text-sm text-blue-200 mt-1">TimeTrack & Attendance</p>
            </div>
            <button
              onClick={closeMobileMenu}
              className="p-2 hover:bg-blue-800 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {filteredNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  onClick={closeMobileMenu}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive
                        ? 'bg-blue-700 text-white'
                        : item.highlight
                          ? 'bg-yellow-200 text-yellow-900 hover:bg-yellow-300'
                          : 'text-blue-100 hover:bg-blue-800'
                    )
                  }
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-blue-700">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold flex-shrink-0">
              {user?.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user?.full_name}</p>
              <p className="text-xs text-blue-200 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              closeMobileMenu();
              logout();
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Abmelden</span>
          </button>
        </div>
      </aside>
    </>
  );
}
