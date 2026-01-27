import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isSameMonth } from 'date-fns';
import { de } from 'date-fns/locale';

export function EmployeeTimes() {
  const { user, isAdmin } = useAuth();
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  if (!user || !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Zugriff verweigert</p>
        </div>
      </div>
    );
  }

  const employees = store.getUsers().filter(u => u.role === 'employee');
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get time logs for selected employee
  const employeeTimeLogs = selectedEmployee 
    ? store.getTimeLogsByUser(selectedEmployee)
    : [];

  // Group time logs by date
  const logsByDate = employeeTimeLogs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = [];
    }
    acc[log.date].push(log);
    return acc;
  }, {} as Record<string, typeof employeeTimeLogs>);

  // Calculate hours per day
  const hoursPerDay = Object.entries(logsByDate).reduce((acc, [date, logs]) => {
    acc[date] = logs.reduce((sum, log) => sum + log.hours, 0);
    return acc;
  }, {} as Record<string, number>);

  const selectedDateLogs = selectedDate ? logsByDate[selectedDate] || [] : [];
  const selectedEmployeeData = employees.find(e => e.id === selectedEmployee);

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Mitarbeiter Zeiterfassung</h1>
        <p className="text-gray-600 mt-1">Detaillierte Übersicht der Arbeitszeiten</p>
      </div>

      {/* Employee Selection */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Mitarbeiter auswählen
        </label>
        <select
          value={selectedEmployee}
          onChange={(e) => {
            setSelectedEmployee(e.target.value);
            setSelectedDate(null);
          }}
          className="w-full max-w-md px-4 py-2 border rounded-lg"
        >
          <option value="">Bitte wählen...</option>
          {employees.map(emp => (
            <option key={emp.id} value={emp.id}>
              {emp.full_name}
            </option>
          ))}
        </select>
      </div>

      {selectedEmployee && (
        <>
          {/* Month Navigation */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h2>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="grid grid-cols-7 gap-2">
              {/* Weekday headers */}
              {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(day => (
                <div key={day} className="text-center font-semibold text-gray-700 py-2">
                  {day}
                </div>
              ))}

              {/* Calendar days */}
              {daysInMonth.map(day => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const hours = hoursPerDay[dateStr] || 0;
                const hasLogs = hours > 0;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={dateStr}
                    onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                    className={`
                      p-3 rounded-lg border-2 transition-all min-h-[80px] flex flex-col items-center justify-center
                      ${!isSameMonth(day, currentMonth) ? 'opacity-30' : ''}
                      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      ${hasLogs ? 'bg-green-50' : 'bg-white'}
                    `}
                  >
                    <span className="text-lg font-semibold text-gray-900 mb-1">
                      {format(day, 'd')}
                    </span>
                    {hasLogs && (
                      <div className="flex items-center gap-1 text-green-700">
                        <Clock className="w-3 h-3" />
                        <span className="text-xs font-bold">{hours}h</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-white border-2 border-gray-200"></div>
                <span className="text-gray-600">Keine Einträge</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-green-50 border-2 border-gray-200"></div>
                <span className="text-gray-600">Zeit erfasst</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-blue-50 border-2 border-blue-500"></div>
                <span className="text-gray-600">Ausgewählt</span>
              </div>
            </div>
          </div>

          {/* Selected Date Details */}
          {selectedDate && selectedDateLogs.length > 0 && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedEmployeeData?.full_name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {format(new Date(selectedDate), 'EEEE, d. MMMM yyyy', { locale: de })}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedDate(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Gesamt Stunden</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {selectedDateLogs.reduce((sum, log) => sum + log.hours, 0)}h
                    </p>
                  </div>

                  <div className="space-y-4">
                    {selectedDateLogs.map(log => {
                      const project = store.getProjectById(log.project_id);
                      const task = log.task_id ? store.getTasks().find(t => t.id === log.task_id) : null;

                      return (
                        <div key={log.id} className="p-4 border rounded-lg">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900">
                                {project?.name || 'Unbekanntes Projekt'}
                              </p>
                              {task && (
                                <p className="text-sm text-gray-600 mt-1">
                                  Aufgabe: {task.title}
                                </p>
                              )}
                            </div>
                            <span className="text-xl font-bold text-blue-600 ml-4">
                              {log.hours}h
                            </span>
                          </div>
                          {log.notes && (
                            <p className="text-sm text-gray-600 mt-2 p-3 bg-gray-50 rounded">
                              {log.notes}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Monthly Summary */}
          {employeeTimeLogs.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                Monatszusammenfassung - {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Gesamt Stunden</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {Object.values(hoursPerDay)
                      .filter((_, idx) => {
                        const date = Object.keys(hoursPerDay)[idx];
                        return isSameMonth(new Date(date), currentMonth);
                      })
                      .reduce((sum, hours) => sum + hours, 0)}h
                  </p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Arbeitstage</p>
                  <p className="text-2xl font-bold text-green-600">
                    {Object.keys(hoursPerDay).filter(date => isSameMonth(new Date(date), currentMonth)).length}
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Ø Stunden/Tag</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(() => {
                      const monthDays = Object.keys(hoursPerDay).filter(date => 
                        isSameMonth(new Date(date), currentMonth)
                      );
                      const monthHours = monthDays.reduce((sum, date) => sum + hoursPerDay[date], 0);
                      return monthDays.length > 0 ? (monthHours / monthDays.length).toFixed(1) : 0;
                    })()}h
                  </p>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {!selectedEmployee && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Clock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Wählen Sie einen Mitarbeiter aus, um die Zeiterfassung zu sehen</p>
        </div>
      )}
    </div>
  );
}
