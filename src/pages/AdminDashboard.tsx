import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, FolderKanban, Users as UsersIcon, AlertTriangle } from 'lucide-react';
import { AttendanceQuickActions } from '../components/AttendanceQuickActions';

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();

  if (!user || !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Zugriff verweigert</p>
        </div>
      </div>
    );
  }

  const allUsers = store.getUsers();
  const allProjects = store.getProjects();
  const allTasks = store.getTasks();

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Systemübersicht</p>
      </div>

      <div className="mb-8 rounded-xl border-2 border-amber-400 bg-amber-100 px-6 py-6 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 mt-0.5 flex-shrink-0" />
          <p className="text-base sm:text-lg font-semibold leading-relaxed">
            Wichtig: Dieses Tool wird aktuell ausschließlich für die Anwesenheitsdokumentation genutzt
            (Anwesend, Homeoffice, Schule, Krankheit, Urlaub oder Sonstiges). Zeiterfassung in Stunden
            ist vorerst deaktiviert.
          </p>
        </div>
      </div>

      <AttendanceQuickActions userId={user.id} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{allUsers.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <UsersIcon className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Aktive Projekte</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allProjects.filter(p => p.is_active).length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <FolderKanban className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Offene Aufgaben</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allTasks.filter(t => t.status === 'Offen').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
