import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderKanban, 
  Clock, 
  Calendar, 
  Users, 
  ClipboardList,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../AuthContext';
import { cn } from '../utils';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

export function Sidebar() {
  const { user, logout, isAdmin } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Übersicht',
      path: '/',
      icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
      label: 'Projekte',
      path: '/projekte',
      icon: <FolderKanban className="w-5 h-5" />,
    },
    {
      label: 'Zeiterfassung',
      path: '/zeiterfassung',
      icon: <Clock className="w-5 h-5" />,
    },
    {
      label: 'Mitarbeiterzeiten',
      path: '/mitarbeiterzeiten',
      icon: <ClipboardList className="w-5 h-5" />,
      adminOnly: true,
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
  ];

  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="w-64 bg-[#1e3a8a] text-white flex flex-col h-screen">
      <div className="p-6 border-b border-blue-700">
        <h1 className="text-2xl font-bold">AdencERP</h1>
        <p className="text-sm text-blue-200 mt-1">TimeTrack & Attendance</p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    isActive
                      ? 'bg-blue-700 text-white'
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
          <div className="w-10 h-10 rounded-full bg-blue-700 flex items-center justify-center font-bold">
            {user?.full_name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user?.full_name}</p>
            <p className="text-xs text-blue-200 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-800 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Abmelden</span>
        </button>
      </div>
    </aside>
  );
}
