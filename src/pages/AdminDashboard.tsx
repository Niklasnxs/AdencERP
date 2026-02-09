import { useAuth } from '../AuthContext';
import { AlertTriangle } from 'lucide-react';
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

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Anwesenheitsübersicht</p>
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
    </div>
  );
}
