import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, CheckCircle, AlertCircle, FolderKanban, Mail, MessageSquare, Video } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AttendanceQuickActions } from '../components/AttendanceQuickActions';

export function Dashboard() {
  const { user, isAdmin } = useAuth();

  if (!user) return null;

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayTimeLogs = store.getTimeLogsByUserAndDate(user.id, today);
  const totalHoursToday = todayTimeLogs.reduce((sum, log) => sum + log.hours, 0);

  const myTasks = store.getTasksByUser(user.id);
  const inProgressTasks = myTasks.filter(t => t.status === 'In Bearbeitung');
  const completedTasks = myTasks.filter(t => t.status === 'Erledigt');

  const allUsers = store.getUsers();
  const allProjects = store.getProjects();
  const allTasks = store.getTasks();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Übersicht</h1>
        <p className="text-gray-600 mt-1">
          Willkommen, {user.full_name}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: de })}
        </p>
      </div>

      <AttendanceQuickActions userId={user.id} />

      {isAdmin ? (
        // Admin Dashboard
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gesamt Benutzer</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{allUsers.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
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
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {allTasks.filter(t => t.status === 'In Bearbeitung').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Employee Dashboard
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Stunden heute</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{totalHoursToday}h</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">In Bearbeitung</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inProgressTasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Erledigt</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completedTasks.length}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Access Links - For All Users */}
      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Schnellzugriff</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Email Access Button */}
            <button
              onClick={() => {
                if (user.email_access) {
                  alert(`Email Zugang:\n\n${user.email_access}`);
                } else {
                  alert('Keine Email-Zugangsdaten hinterlegt.');
                }
              }}
              className="flex items-center gap-4 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-200"
            >
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Email Zugang</h3>
                <p className="text-sm text-gray-600">Zugangsdaten anzeigen</p>
              </div>
            </button>

            {/* Mattermost Button */}
            <button
              onClick={() => {
                if (user.mattermost_url) {
                  window.open(user.mattermost_url, '_blank');
                } else {
                  alert('Kein Mattermost-Link hinterlegt.');
                }
              }}
              className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Mattermost</h3>
                <p className="text-sm text-gray-600">Team Chat öffnen</p>
              </div>
            </button>

            {/* Zoom Button */}
            <button
              onClick={() => {
                if (user.zoom_link) {
                  window.open(user.zoom_link, '_blank');
                } else {
                  alert('Kein Zoom-Link hinterlegt.');
                }
              }}
              className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Zoom Meeting</h3>
                <p className="text-sm text-gray-600">Meeting beitreten</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {isAdmin ? 'System Übersicht' : 'Meine Aufgaben'}
          </h2>
        </div>
        <div className="p-6">
          {isAdmin ? (
            <div className="space-y-4">
              <p className="text-gray-600">Systemübersicht und aktuelle Aktivitäten</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Aktive Projekte</h3>
                  <ul className="space-y-2">
                    {allProjects.filter(p => p.is_active).slice(0, 5).map(project => (
                      <li key={project.id} className="text-sm text-gray-600">
                        • {project.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Mitarbeiter</h3>
                  <ul className="space-y-2">
                    {allUsers.slice(0, 5).map(u => (
                      <li key={u.id} className="text-sm text-gray-600">
                        • {u.full_name} ({u.role})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div>
              {myTasks.length === 0 ? (
                <p className="text-gray-500">Keine Aufgaben zugewiesen</p>
              ) : (
                <div className="space-y-3">
                  {myTasks.slice(0, 5).map(task => {
                    const project = store.getProjectById(task.project_id);
                    return (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-500">{project?.name}</p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            task.status === 'Erledigt'
                              ? 'bg-green-100 text-green-700'
                              : task.status === 'In Bearbeitung'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {task.status}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
