import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Calendar as CalendarIcon, Plus, X, Edit, Clock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, isFuture, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { AbsenceType } from '../types';

export function Calendar() {
  const { user, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ date: string; userId: string } | null>(null);
  const [isEditingAbsence, setIsEditingAbsence] = useState(false);
  const [isAddingRetroactiveAbsence, setIsAddingRetroactiveAbsence] = useState(false);
  const [editAbsenceReason, setEditAbsenceReason] = useState('');
  const [retroAbsenceType, setRetroAbsenceType] = useState<AbsenceType>('Krankheit');
  const [retroAbsenceReason, setRetroAbsenceReason] = useState('');
  const [absenceDate, setAbsenceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Krankheit');
  const [absenceReason, setAbsenceReason] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [editingTimeLogId, setEditingTimeLogId] = useState<string | null>(null);
  const [editTimeLogHours, setEditTimeLogHours] = useState<number>(0);
  const [editTimeLogNotes, setEditTimeLogNotes] = useState<string>('');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [newStatusType, setNewStatusType] = useState<AbsenceType>('Krankheit');
  const [newStatusReason, setNewStatusReason] = useState<string>('');
  const [newTimeLogHours, setNewTimeLogHours] = useState<number>(8);
  const [newTimeLogProject, setNewTimeLogProject] = useState<string>('');
  const [newTimeLogNotes, setNewTimeLogNotes] = useState<string>('');

  if (!user) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    await store.createAbsence({
      user_id: user.id,
      date: absenceDate,
      type: absenceType,
      reason: absenceReason,
    });
    setAbsenceDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsenceType('Krankheit');
    setAbsenceReason('');
    setShowAbsenceForm(false);
    // Re-initialize store to fetch fresh data
    await store.initialize();
    // Force component re-render by navigating to same page
    window.location.href = window.location.href;
  };

  const users = isAdmin ? store.getUsers() : [user];
  const attendance = store.getAttendanceForPeriod(
    format(monthStart, 'yyyy-MM-dd'),
    format(monthEnd, 'yyyy-MM-dd')
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Anwesend':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Entschuldigt':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Unentschuldigt':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
          <p className="text-gray-600 mt-1">Anwesenheit und Abwesenheitsmeldungen</p>
        </div>
        {!isAdmin && (
          <button
            onClick={() => setShowAbsenceForm(true)}
            className="flex items-center gap-2 bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Abwesenheit melden
          </button>
        )}
      </div>

      {showAbsenceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Abwesenheitsnotiz erstellen</h2>
            <form onSubmit={handleSubmitAbsence} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Datum
                </label>
                <input
                  type="date"
                  value={absenceDate}
                  onChange={(e) => setAbsenceDate(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Typ
                </label>
                <select
                  value={absenceType}
                  onChange={(e) => setAbsenceType(e.target.value as AbsenceType)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="Krankheit">Krankheit</option>
                  <option value="Termin">Termin</option>
                  <option value="Sonstiges">Sonstiges</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund
                </label>
                <textarea
                  value={absenceReason}
                  onChange={(e) => setAbsenceReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg h-24"
                  placeholder="Grund für Abwesenheit"
                  required
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
                  onClick={() => setShowAbsenceForm(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Legende</h3>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-700">Anwesend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-yellow-500"></div>
            <span className="text-sm text-gray-700">Entschuldigt</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-700">Unentschuldigt gefehlt</span>
          </div>
        </div>
      </div>

      {/* Calendar Navigation */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-6 border-b flex items-center justify-between">
          <button
            onClick={() => setCurrentDate(subMonths(currentDate, 1))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            ← Vorheriger Monat
          </button>
          <h2 className="text-xl font-bold text-gray-900">
            {format(currentDate, 'MMMM yyyy', { locale: de })}
          </h2>
          <button
            onClick={() => setCurrentDate(addMonths(currentDate, 1))}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Nächster Monat →
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left font-medium text-gray-700 border-b min-w-[150px]">
                  Mitarbeiter
                </th>
                {daysInMonth.map((day) => (
                  <th
                    key={day.toISOString()}
                    className={`p-2 text-center font-medium text-gray-700 border-b min-w-[40px] ${
                      isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="text-xs">{format(day, 'EEE', { locale: de })}</div>
                    <div className="text-sm">{format(day, 'd')}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((employee) => (
                <tr key={employee.id} className="border-b last:border-0">
                  <td className="p-2 font-medium text-gray-900">
                    {employee.full_name}
                  </td>
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isWeekendDay = isWeekend(day);
                    const isFutureDay = isFuture(startOfDay(day));
                    const isDisabled = isWeekendDay || isFutureDay;
                    
                    const dayAttendance = attendance.find(
                      (a) => a.user_id === employee.id && a.date === dateStr
                    );
                    const status = dayAttendance?.status || 'Anwesend';
                    
                    // If weekend or future, show gray. Otherwise show status color
                    const statusColor = isDisabled
                      ? 'bg-gray-300'
                      : status === 'Anwesend'
                      ? 'bg-green-500'
                      : status === 'Entschuldigt'
                      ? 'bg-yellow-500'
                      : 'bg-red-500';

                    return (
                      <td
                        key={day.toISOString()}
                        className={`p-2 text-center ${
                          isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                        } ${isDisabled ? 'opacity-50' : ''}`}
                      >
                        <div
                          onClick={() => {
                            if (isAdmin && !isDisabled) {
                              setSelectedDay({ date: dateStr, userId: employee.id });
                              setShowDayDetailsModal(true);
                            }
                          }}
                          className={`w-6 h-6 rounded mx-auto ${statusColor} ${
                            isAdmin && !isDisabled ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all' : ''
                          }`}
                          title={isDisabled ? (isWeekendDay ? 'Wochenende' : 'Zukünftiger Tag') : status}
                        ></div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day Details Modal (Admin Only) */}
      {showDayDetailsModal && selectedDay && isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {(() => {
              const employee = store.getUserById(selectedDay.userId);
              const dayAttendance = attendance.find(
                (a) => a.user_id === selectedDay.userId && a.date === selectedDay.date
              );
              const status = dayAttendance?.status || 'Anwesend';
              const timeLogs = store.getTimeLogs().filter(
                (log) => log.user_id === selectedDay.userId && log.date === selectedDay.date
              );
              const dayAbsence = store.getAbsences().find(
                (abs) => abs.user_id === selectedDay.userId && abs.date === selectedDay.date
              );

              return (
                <>
                  {/* Header */}
                  <div className="p-6 border-b flex items-center justify-between bg-gray-50">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">{employee?.full_name}</h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {format(new Date(selectedDay.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setShowDayDetailsModal(false);
                        setSelectedDay(null);
                        setIsEditingAbsence(false);
                        setEditAbsenceReason('');
                      }}
                      className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Status Badge with Change Option */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between">
                        <span className={`inline-flex px-4 py-2 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
                          Status: {status}
                        </span>
                        {!isChangingStatus && (
                          <button
                            onClick={() => setIsChangingStatus(true)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                          >
                            Status ändern
                          </button>
                        )}
                      </div>
                      
                      {/* Status Change Form */}
                      {isChangingStatus && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                          <h4 className="font-semibold text-gray-900 mb-3">Status ändern</h4>
                          
                          {(status === 'Entschuldigt' || status === 'Unentschuldigt') ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600 mb-3">Zu "Anwesend" ändern (Arbeitszeit eintragen):</p>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Projekt *
                                </label>
                                <select
                                  value={newTimeLogProject}
                                  onChange={(e) => setNewTimeLogProject(e.target.value)}
                                  className="w-full px-4 py-2 border rounded-lg"
                                  required
                                >
                                  <option value="">Projekt auswählen...</option>
                                  {store.getActiveProjects().map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Stunden *
                                </label>
                                <input
                                  type="number"
                                  value={newTimeLogHours}
                                  onChange={(e) => setNewTimeLogHours(parseFloat(e.target.value))}
                                  min="0"
                                  step="0.5"
                                  className="w-full px-4 py-2 border rounded-lg"
                                  required
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Notizen (optional)
                                </label>
                                <textarea
                                  value={newTimeLogNotes}
                                  onChange={(e) => setNewTimeLogNotes(e.target.value)}
                                  className="w-full px-4 py-2 border rounded-lg h-20"
                                  placeholder="Beschreibung der Arbeit..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    if (!newTimeLogProject) {
                                      alert('Bitte wählen Sie ein Projekt aus');
                                      return;
                                    }
                                    // Delete the absence if exists
                                    if (dayAbsence) {
                                      const absenceIndex = store.getAbsences().findIndex(a => a.id === dayAbsence.id);
                                      if (absenceIndex !== -1) {
                                        store.getAbsences().splice(absenceIndex, 1);
                                      }
                                    }
                                    // Create time log
                                    store.createTimeLog({
                                      user_id: selectedDay.userId,
                                      project_id: newTimeLogProject,
                                      date: selectedDay.date,
                                      hours: newTimeLogHours,
                                      notes: newTimeLogNotes || undefined,
                                    });
                                    setIsChangingStatus(false);
                                    setNewTimeLogProject('');
                                    setNewTimeLogHours(8);
                                    setNewTimeLogNotes('');
                                    setShowDayDetailsModal(false);
                                    setSelectedDay(null);
                                  }}
                                  disabled={!newTimeLogProject}
                                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  Zu Anwesend ändern
                                </button>
                                <button
                                  onClick={() => {
                                    setIsChangingStatus(false);
                                    setNewTimeLogProject('');
                                    setNewTimeLogHours(8);
                                    setNewTimeLogNotes('');
                                  }}
                                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : status === 'Anwesend' ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600">Zu "Entschuldigt" ändern:</p>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Abwesenheitstyp
                                </label>
                                <select
                                  value={newStatusType}
                                  onChange={(e) => setNewStatusType(e.target.value as AbsenceType)}
                                  className="w-full px-4 py-2 border rounded-lg"
                                >
                                  <option value="Krankheit">Krankheit</option>
                                  <option value="Urlaub">Urlaub</option>
                                  <option value="Schule">Schule</option>
                                  <option value="Sonstiges">Sonstiges</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Grund (optional)
                                </label>
                                <textarea
                                  value={newStatusReason}
                                  onChange={(e) => setNewStatusReason(e.target.value)}
                                  className="w-full px-4 py-2 border rounded-lg h-20"
                                  placeholder="Grund für Abwesenheit..."
                                />
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Delete all time logs for this day
                                    timeLogs.forEach(log => store.deleteTimeLog(log.id));
                                    // Create absence
                                    store.createAbsence({
                                      user_id: selectedDay.userId,
                                      date: selectedDay.date,
                                      type: newStatusType,
                                      reason: newStatusReason.trim() || '-',
                                    });
                                    setIsChangingStatus(false);
                                    setShowDayDetailsModal(false);
                                    setSelectedDay(null);
                                  }}
                                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                  Zu Entschuldigt ändern
                                </button>
                                <button
                                  onClick={() => {
                                    setIsChangingStatus(false);
                                    setNewStatusReason('');
                                  }}
                                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : status === 'Entschuldigt' ? (
                            <div className="space-y-3">
                              <p className="text-sm text-gray-600">
                                Zu "Anwesend" ändern: Abwesenheitsmeldung wird gelöscht.
                              </p>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    // Delete the absence
                                    if (dayAbsence) {
                                      const absenceIndex = store.getAbsences().findIndex(a => a.id === dayAbsence.id);
                                      if (absenceIndex !== -1) {
                                        store.getAbsences().splice(absenceIndex, 1);
                                      }
                                    }
                                    setIsChangingStatus(false);
                                    setShowDayDetailsModal(false);
                                    setSelectedDay(null);
                                  }}
                                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                                >
                                  Zu Anwesend ändern
                                </button>
                                <button
                                  onClick={() => {
                                    setIsChangingStatus(false);
                                  }}
                                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                                >
                                  Abbrechen
                                </button>
                              </div>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {/* Work Hours */}
                    {timeLogs.length > 0 && (
                      <div className="mb-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                          <Clock className="w-5 h-5" />
                          Arbeitszeit
                        </h3>
                        <div className="space-y-3">
                          {timeLogs.map((log) => {
                            const project = store.getProjects().find(p => p.id === log.project_id);
                            const isEditing = editingTimeLogId === log.id;
                            
                            return (
                              <div key={log.id} className="p-4 bg-gray-50 rounded-lg border">
                                {isEditing ? (
                                  <div className="space-y-3">
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Stunden
                                      </label>
                                      <input
                                        type="number"
                                        value={editTimeLogHours}
                                        onChange={(e) => setEditTimeLogHours(parseFloat(e.target.value))}
                                        min="0"
                                        step="0.5"
                                        className="w-full px-4 py-2 border rounded-lg"
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notizen
                                      </label>
                                      <textarea
                                        value={editTimeLogNotes}
                                        onChange={(e) => setEditTimeLogNotes(e.target.value)}
                                        className="w-full px-4 py-2 border rounded-lg h-20"
                                        placeholder="Notizen zur Arbeitszeit..."
                                      />
                                    </div>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          store.updateTimeLog(log.id, {
                                            hours: editTimeLogHours,
                                            notes: editTimeLogNotes
                                          });
                                          setEditingTimeLogId(null);
                                          setShowDayDetailsModal(false);
                                          setSelectedDay(null);
                                        }}
                                        className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700 text-sm"
                                      >
                                        Speichern
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingTimeLogId(null);
                                          setEditTimeLogHours(0);
                                          setEditTimeLogNotes('');
                                        }}
                                        className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 text-sm"
                                      >
                                        Abbrechen
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (confirm('Möchten Sie diesen Zeiteintrag wirklich löschen?')) {
                                            store.deleteTimeLog(log.id);
                                            setEditingTimeLogId(null);
                                            setShowDayDetailsModal(false);
                                            setSelectedDay(null);
                                          }
                                        }}
                                        className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 text-sm"
                                      >
                                        Löschen
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900">{project?.name || 'Unbekanntes Projekt'}</div>
                                      {log.notes && (
                                        <p className="text-sm text-gray-600 mt-1">{log.notes}</p>
                                      )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="text-right">
                                        <div className="text-lg font-bold text-blue-600">{log.hours}h</div>
                                      </div>
                                      <button
                                        onClick={() => {
                                          setEditingTimeLogId(log.id);
                                          setEditTimeLogHours(log.hours);
                                          setEditTimeLogNotes(log.notes || '');
                                        }}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        title="Bearbeiten"
                                      >
                                        <Edit className="w-4 h-4" />
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-gray-900">Gesamt:</span>
                              <span className="text-xl font-bold text-blue-600">
                                {timeLogs.reduce((sum, log) => sum + log.hours, 0)}h
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Absence Information */}
                    {dayAbsence && (
                      <div className="mb-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-lg font-semibold text-gray-900">Abwesenheitsgrund</h3>
                          {!isEditingAbsence && (
                            <button
                              onClick={() => {
                                setIsEditingAbsence(true);
                                setEditAbsenceReason(dayAbsence.reason);
                              }}
                              className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                            >
                              <Edit className="w-4 h-4" />
                              Bearbeiten
                            </button>
                          )}
                        </div>

                        {isEditingAbsence ? (
                          <div className="space-y-3">
                            <textarea
                              value={editAbsenceReason}
                              onChange={(e) => setEditAbsenceReason(e.target.value)}
                              className="w-full px-4 py-2 border rounded-lg h-24"
                              placeholder="Grund für Abwesenheit"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  store.updateAbsence(dayAbsence.id, { reason: editAbsenceReason });
                                  setIsEditingAbsence(false);
                                  setShowDayDetailsModal(false);
                                  setSelectedDay(null);
                                }}
                                className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setIsEditingAbsence(false);
                                  setEditAbsenceReason('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="font-medium text-yellow-900 mb-1">{dayAbsence.type}</div>
                            <p className="text-sm text-yellow-800">{dayAbsence.reason}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* No Data - Unexcused Absence */}
                    {timeLogs.length === 0 && !dayAbsence && status === 'Unentschuldigt' && (
                      <div>
                        {!isAddingRetroactiveAbsence ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <X className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unentschuldigt gefehlt</h3>
                            <p className="text-gray-600 mb-4">
                              Keine Zeiterfassung und keine Abwesenheitsmeldung für diesen Tag.
                            </p>
                            <button
                              onClick={() => {
                                setIsAddingRetroactiveAbsence(true);
                                setRetroAbsenceType('Krankheit');
                                setRetroAbsenceReason('');
                              }}
                              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
                            >
                              Abwesenheit nachtragen
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-gray-900">Abwesenheit nachtragen</h3>
                            
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Typ *
                              </label>
                              <select
                                value={retroAbsenceType}
                                onChange={(e) => setRetroAbsenceType(e.target.value as AbsenceType)}
                                className="w-full px-4 py-2 border rounded-lg"
                                required
                              >
                                <option value="Krankheit">Krankheit</option>
                                <option value="Urlaub">Urlaub</option>
                                <option value="Schule">Schule</option>
                                <option value="Sonstiges">Sonstiges</option>
                              </select>
                            </div>

                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Grund (optional)
                              </label>
                              <textarea
                                value={retroAbsenceReason}
                                onChange={(e) => setRetroAbsenceReason(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg h-24"
                                placeholder="Optionaler Grund für Abwesenheit..."
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  store.createAbsence({
                                    user_id: selectedDay.userId,
                                    date: selectedDay.date,
                                    type: retroAbsenceType,
                                    reason: retroAbsenceReason.trim() || '-',
                                  });
                                  setShowDayDetailsModal(false);
                                  setSelectedDay(null);
                                  setIsAddingRetroactiveAbsence(false);
                                  setRetroAbsenceReason('');
                                }}
                                className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                              >
                                Speichern
                              </button>
                              <button
                                onClick={() => {
                                  setIsAddingRetroactiveAbsence(false);
                                  setRetroAbsenceReason('');
                                }}
                                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                              >
                                Abbrechen
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {timeLogs.length === 0 && !dayAbsence && status === 'Anwesend' && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Keine Zeiteinträge für diesen Tag vorhanden.</p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="p-6 border-t bg-gray-50">
                    <button
                      onClick={() => {
                        setShowDayDetailsModal(false);
                        setSelectedDay(null);
                        setIsEditingAbsence(false);
                        setEditAbsenceReason('');
                      }}
                      className="w-full bg-gray-700 text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium"
                    >
                      Schließen
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* My Absences (Employee View) */}
      {!isAdmin && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900">Meine Abwesenheitsmeldungen</h2>
          </div>
          <div className="p-6">
            {(() => {
              const myAbsences = store.getAbsencesByUser(user.id);
              return myAbsences.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Keine Abwesenheitsmeldungen vorhanden</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Datum</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Typ</th>
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Grund</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myAbsences
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((absence) => (
                          <tr key={absence.id} className="border-b last:border-0">
                            <td className="py-3 px-4 text-sm text-gray-900">
                              {format(new Date(absence.date), 'dd.MM.yyyy')}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('Entschuldigt')}`}>
                                {absence.type}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-gray-600">{absence.reason}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* All Absences (Admin View) */}
      {isAdmin && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Alle Abwesenheitsmeldungen</h2>
            
            {/* Filter Controls */}
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitarbeiter filtern
                </label>
                <select
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="all">Alle Mitarbeiter</option>
                  {store.getUsers().map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex-1 min-w-[200px]">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monat filtern
                </label>
                <select
                  value={filterMonth}
                  onChange={(e) => setFilterMonth(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                >
                  <option value="all">Alle Monate</option>
                  {(() => {
                    // Get unique months from absences
                    const allAbsences = store.getAbsences();
                    const months = new Set<string>();
                    allAbsences.forEach(absence => {
                      const date = new Date(absence.date);
                      const monthKey = format(date, 'yyyy-MM');
                      months.add(monthKey);
                    });
                    return Array.from(months)
                      .sort()
                      .reverse()
                      .map(monthKey => {
                        const date = new Date(monthKey + '-01');
                        return (
                          <option key={monthKey} value={monthKey}>
                            {format(date, 'MMMM yyyy', { locale: de })}
                          </option>
                        );
                      });
                  })()}
                </select>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            {(() => {
              let allAbsences = store.getAbsences();
              
              // Apply employee filter
              if (filterEmployee !== 'all') {
                allAbsences = allAbsences.filter(a => a.user_id === filterEmployee);
              }
              
              // Apply month filter
              if (filterMonth !== 'all') {
                allAbsences = allAbsences.filter(a => {
                  const absenceMonth = format(new Date(a.date), 'yyyy-MM');
                  return absenceMonth === filterMonth;
                });
              }
              
              return allAbsences.length === 0 ? (
                <div className="text-center py-12">
                  <CalendarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {filterEmployee !== 'all' || filterMonth !== 'all' 
                      ? 'Keine Abwesenheitsmeldungen für die ausgewählten Filter'
                      : 'Keine Abwesenheitsmeldungen vorhanden'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 text-sm text-gray-600">
                    {allAbsences.length} {allAbsences.length === 1 ? 'Eintrag' : 'Einträge'} gefunden
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Mitarbeiter</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Datum</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Typ</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-700">Grund</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allAbsences
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((absence) => {
                            const employee = store.getUserById(absence.user_id);
                            return (
                              <tr key={absence.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {employee?.full_name}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {format(new Date(absence.date), 'dd.MM.yyyy')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor('Entschuldigt')}`}>
                                    {absence.type}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-600">{absence.reason}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
