import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, Plus } from 'lucide-react';
import { format } from 'date-fns';
import type { TimeLog } from '../types';

export function TimeTracking() {
  const { user } = useAuth();
  const [timeLogs, setTimeLogs] = useState<TimeLog[]>(
    user ? store.getTimeLogsByUser(user.id) : []
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    project_id: '',
    task_id: '',
    hours: '',
    notes: '',
  });

  if (!user) return null;

  const projects = store.getActiveProjects();
  const myTasks = store.getTasksByUser(user.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.project_id || !formData.hours) return;

    store.createTimeLog({
      user_id: user.id,
      project_id: formData.project_id,
      task_id: formData.task_id || undefined,
      date: formData.date,
      hours: parseFloat(formData.hours),
      notes: formData.notes || undefined,
    });

    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      project_id: '',
      task_id: '',
      hours: '',
      notes: '',
    });
    setShowForm(false);
    setTimeLogs(store.getTimeLogsByUser(user.id));
  };

  const totalHours = timeLogs.reduce((sum, log) => sum + log.hours, 0);
  const thisMonthLogs = timeLogs.filter(log => {
    const logDate = new Date(log.date);
    const now = new Date();
    return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
  });
  const thisMonthHours = thisMonthLogs.reduce((sum, log) => sum + log.hours, 0);

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Zeiterfassung</h1>
          <p className="text-gray-600 mt-1">Erfassen Sie Ihre Arbeitszeit</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Zeit eintragen
        </button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Zeit eintragen</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Projekt *
                </label>
                <select
                  value={formData.project_id}
                  onChange={(e) => setFormData({ ...formData, project_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Projekt wählen...</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aufgabe (optional)
                </label>
                <select
                  value={formData.task_id}
                  onChange={(e) => setFormData({ ...formData, task_id: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="">Keine Aufgabe</option>
                  {myTasks
                    .filter(t => t.project_id === formData.project_id)
                    .map(task => (
                      <option key={task.id} value={task.id}>
                        {task.title}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stunden *
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="24"
                  value={formData.hours}
                  onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                  placeholder="8"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Beschreibung
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                  placeholder="Was haben Sie heute gemacht?"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Speichern
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stunden dieser Monat</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{thisMonthHours}h</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gesamt Stunden</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalHours}h</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Time Logs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b">
          <h2 className="text-xl font-bold text-gray-900">Meine Zeiteinträge</h2>
        </div>
        <div className="p-6">
          {timeLogs.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Noch keine Zeiteinträge vorhanden</p>
              <button
                onClick={() => setShowForm(true)}
                className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
              >
                Ersten Eintrag erstellen
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Datum</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Projekt</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Aufgabe</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Stunden</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Beschreibung</th>
                  </tr>
                </thead>
                <tbody>
                  {timeLogs
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(log => {
                      const project = store.getProjectById(log.project_id);
                      const task = log.task_id ? myTasks.find(t => t.id === log.task_id) : null;
                      return (
                        <tr key={log.id} className="border-b last:border-0">
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {format(new Date(log.date), 'dd.MM.yyyy')}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {project?.name || '-'}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {task?.title || <em className="text-gray-400">-</em>}
                          </td>
                          <td className="py-3 px-4 text-sm font-medium text-gray-900">
                            {log.hours}h
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {log.notes || <em className="text-gray-400">-</em>}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
