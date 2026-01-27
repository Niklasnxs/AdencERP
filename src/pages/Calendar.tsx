import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, isFuture, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { AbsenceType } from '../types';

export function Calendar() {
  const { user, isAdmin } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [absenceDate, setAbsenceDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Krankheit');
  const [absenceReason, setAbsenceReason] = useState('');

  if (!user) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSubmitAbsence = (e: React.FormEvent) => {
    e.preventDefault();
    store.createAbsence({
      user_id: user.id,
      date: absenceDate,
      type: absenceType,
      reason: absenceReason,
    });
    setAbsenceDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsenceType('Krankheit');
    setAbsenceReason('');
    setShowAbsenceForm(false);
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
                          className={`w-6 h-6 rounded mx-auto ${statusColor}`}
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
            <h2 className="text-xl font-bold text-gray-900">Alle Abwesenheitsmeldungen</h2>
          </div>
          <div className="p-6">
            {(() => {
              const allAbsences = store.getAbsences();
              return allAbsences.length === 0 ? (
                <p className="text-gray-500">Keine Abwesenheitsmeldungen vorhanden</p>
              ) : (
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
                            <tr key={absence.id} className="border-b last:border-0">
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
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
