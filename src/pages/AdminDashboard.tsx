import { useMemo } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, FolderKanban, Users as UsersIcon, Download } from 'lucide-react';
import { format } from 'date-fns';
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
  const allTimeLogs = store.getTimeLogs();

  const csvData = useMemo(() => {
    const header = ['Mitarbeiter', 'E-Mail', 'Datum', 'Kunde', 'Projekt', 'Aufgabe', 'Stunden', 'Beschreibung'];
    const rows = allTimeLogs.map(log => {
      const employee = allUsers.find(u => u.id.toString() === log.user_id.toString());
      const project = log.project_id ? store.getProjectById(log.project_id) : undefined;
      const task = log.task_id ? allTasks.find(t => t.id === log.task_id) : undefined;
      return [
        employee?.full_name || 'Unbekannt',
        employee?.email || '',
        format(new Date(log.date), 'dd.MM.yyyy'),
        log.customer_name,
        project?.name || 'Unbekanntes Projekt',
        task?.title || '',
        String(log.hours),
        log.notes || ''
      ];
    });
    return [header, ...rows];
  }, [allTimeLogs, allUsers, allTasks]);

  const handleExportCSV = () => {
    const lines = csvData.map(row => row.map(field => {
      if (field === null || field === undefined) return '';
      const value = String(field).replace(/"/g, '""');
      if (value.includes(';') || value.includes('"') || value.includes('\n')) {
        return `"${value}"`;
      }
      return value;
    }).join(';'));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zeiterfassung_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-1">Systemübersicht und Zeiterfassung</p>
        <button
          onClick={handleExportCSV}
          className="mt-4 inline-flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Download className="w-4 h-4" />
          Zeiterfassung als CSV exportieren
        </button>
      </div>

      <AttendanceQuickActions userId={user.id} />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamte Stunden</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {allTimeLogs.reduce((sum, log) => sum + Number(log.hours), 0)}h
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
