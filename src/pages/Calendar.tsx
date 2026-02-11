import { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { usersAPI, projectsAPI, timeLogsAPI, absencesAPI, customersAPI } from '../services/api';
import { Calendar as CalendarIcon, X, Edit } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isWeekend, isFuture, startOfDay } from 'date-fns';
import { de } from 'date-fns/locale';
import type { AbsenceType, AttendanceStatus, Absence, Project, TimeLog, User, Customer } from '../types';

export function Calendar() {
  const { user, isAdmin } = useAuth();
  type EmployeeDayStatus = 'Anwesend' | 'Homeoffice' | 'Schule' | 'Krankheit' | 'Sonstiges' | '';
  const [currentDate, setCurrentDate] = useState(new Date());
  const [refreshKey, setRefreshKey] = useState(0);
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showDayDetailsModal, setShowDayDetailsModal] = useState(false);
  const [showEmployeeDayModal, setShowEmployeeDayModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ date: string; userId: string } | null>(null);
  const [employeeDayStatus, setEmployeeDayStatus] = useState<EmployeeDayStatus>('');
  const [employeeDayReason, setEmployeeDayReason] = useState('');
  const [isEditingAbsence, setIsEditingAbsence] = useState(false);
  const [isAddingRetroactiveAbsence, setIsAddingRetroactiveAbsence] = useState(false);
  const [editAbsenceReason, setEditAbsenceReason] = useState('');
  const [retroAbsenceType, setRetroAbsenceType] = useState<AbsenceType>('Krankheit');
  const [retroAbsenceReason, setRetroAbsenceReason] = useState('');
  const [absenceStartDate, setAbsenceStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [absenceEndDate, setAbsenceEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationEmployeeId, setVacationEmployeeId] = useState<string>('');
  const [vacationStartDate, setVacationStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationEndDate, setVacationEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationReason, setVacationReason] = useState('');
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [schoolEmployeeId, setSchoolEmployeeId] = useState<string>('');
  const [schoolStartDate, setSchoolStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolEndDate, setSchoolEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolReason, setSchoolReason] = useState('');
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [absenceType, setAbsenceType] = useState<AbsenceType>('Krankheit');
  const [absenceReason, setAbsenceReason] = useState('');
  const [filterEmployee, setFilterEmployee] = useState<string>('all');
  const [filterMonth, setFilterMonth] = useState<string>('all');
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [targetStatus, setTargetStatus] = useState<'Anwesend' | 'Entschuldigt' | 'Unentschuldigt'>('Entschuldigt');
  const [targetAbsenceType, setTargetAbsenceType] = useState<AbsenceType>('Krankheit');
  const [targetReason, setTargetReason] = useState<string>('');
  const [usersData, setUsersData] = useState<User[]>([]);
  const [_projectsData, setProjectsData] = useState<Project[]>([]);
  const [_customersData, setCustomersData] = useState<Customer[]>([]);
  const [timeLogsData, setTimeLogsData] = useState<TimeLog[]>([]);
  const [absencesData, setAbsencesData] = useState<Absence[]>([]);

  if (!user) return null;

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getEasterSunday = (year: number) => {
    const a = year % 19;
    const b = Math.floor(year / 100);
    const c = year % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return new Date(year, month - 1, day);
  };

  const getHamburgHoliday = (date: Date) => {
    const year = date.getFullYear();
    const dateKey = format(date, 'yyyy-MM-dd');
    const easter = getEasterSunday(year);
    const holidayMap: Record<string, string> = {
      [format(new Date(year, 0, 1), 'yyyy-MM-dd')]: 'Neujahr',
      [format(new Date(year, 4, 1), 'yyyy-MM-dd')]: 'Tag der Arbeit',
      [format(new Date(year, 9, 3), 'yyyy-MM-dd')]: 'Tag der Deutschen Einheit',
      [format(new Date(year, 9, 31), 'yyyy-MM-dd')]: 'Reformationstag',
      [format(new Date(year, 11, 25), 'yyyy-MM-dd')]: '1. Weihnachtstag',
      [format(new Date(year, 11, 26), 'yyyy-MM-dd')]: '2. Weihnachtstag',
    };

    const goodFriday = new Date(easter);
    goodFriday.setDate(goodFriday.getDate() - 2);
    const easterMonday = new Date(easter);
    easterMonday.setDate(easterMonday.getDate() + 1);
    const ascensionDay = new Date(easter);
    ascensionDay.setDate(ascensionDay.getDate() + 39);
    const whitMonday = new Date(easter);
    whitMonday.setDate(whitMonday.getDate() + 50);

    holidayMap[format(goodFriday, 'yyyy-MM-dd')] = 'Karfreitag';
    holidayMap[format(easterMonday, 'yyyy-MM-dd')] = 'Ostermontag';
    holidayMap[format(ascensionDay, 'yyyy-MM-dd')] = 'Christi Himmelfahrt';
    holidayMap[format(whitMonday, 'yyyy-MM-dd')] = 'Pfingstmontag';

    return holidayMap[dateKey] || null;
  };

  const handleSubmitAbsence = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(absenceStartDate);
    const end = new Date(absenceEndDate);
    const days = eachDayOfInterval({ start, end });
    for (const day of days) {
      await store.createAbsence({
        user_id: user.id,
        date: format(day, 'yyyy-MM-dd'),
        type: absenceType,
        reason: absenceReason,
      });
    }
    setAbsenceStartDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsenceEndDate(format(new Date(), 'yyyy-MM-dd'));
    setAbsenceType('Krankheit');
    setAbsenceReason('');
    setShowAbsenceForm(false);
    // Re-initialize store to fetch fresh data
    await store.initialize();
    // Give the API calls time to complete before forcing re-render
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  const handleCreateVacationRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vacationEmployeeId) {
      alert('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }
    const start = new Date(vacationStartDate);
    const end = new Date(vacationEndDate);
    const days = eachDayOfInterval({ start, end });
    const failedDates: string[] = [];

    for (const day of days) {
      const dateString = format(day, 'yyyy-MM-dd');
      try {
        await store.createAbsence({
          user_id: vacationEmployeeId,
          date: dateString,
          type: 'Urlaub',
          reason: vacationReason.trim() || '-',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Absence already exists')) {
          continue;
        }
        failedDates.push(dateString);
      }
    }

    if (failedDates.length > 0) {
      alert(`Einige Tage konnten nicht gespeichert werden: ${failedDates.join(', ')}`);
    }

    setVacationEmployeeId('');
    setVacationStartDate(format(new Date(), 'yyyy-MM-dd'));
    setVacationEndDate(format(new Date(), 'yyyy-MM-dd'));
    setVacationReason('');
    await store.initialize();
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  const handleCreateSchoolRange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolEmployeeId) {
      alert('Bitte wählen Sie einen Mitarbeiter aus');
      return;
    }
    const start = new Date(schoolStartDate);
    const end = new Date(schoolEndDate);
    const days = eachDayOfInterval({ start, end });
    const failedDates: string[] = [];

    for (const day of days) {
      const dateString = format(day, 'yyyy-MM-dd');
      try {
        await store.createAbsence({
          user_id: schoolEmployeeId,
          date: dateString,
          type: 'Schule',
          reason: schoolReason.trim() || '-',
        });
      } catch (error) {
        if (error instanceof Error && error.message.includes('Absence already exists')) {
          continue;
        }
        failedDates.push(dateString);
      }
    }

    if (failedDates.length > 0) {
      alert(`Einige Tage konnten nicht gespeichert werden: ${failedDates.join(', ')}`);
    }

    setSchoolEmployeeId('');
    setSchoolStartDate(format(new Date(), 'yyyy-MM-dd'));
    setSchoolEndDate(format(new Date(), 'yyyy-MM-dd'));
    setSchoolReason('');
    setShowSchoolModal(false);
    await store.initialize();
    setTimeout(() => {
      setRefreshKey(prev => prev + 1);
    }, 500);
  };

  useEffect(() => {
    const normalizeDate = (value: string) => {
      if (!value) return value;
      return value.includes('T') ? value.split('T')[0] : value;
    };

    const loadCalendarData = async () => {
      try {
        const start = format(monthStart, 'yyyy-MM-dd');
        const end = format(monthEnd, 'yyyy-MM-dd');
        const [users, projects, customers, timeLogs, absences] = await Promise.all([
          usersAPI.getAll(),
          projectsAPI.getAll(),
          customersAPI.getAll(),
          timeLogsAPI.getAll({ start_date: start, end_date: end }),
          absencesAPI.getAll({ start_date: start, end_date: end }),
        ]);
        const normalizedTimeLogs = timeLogs.map((log: TimeLog) => ({
          ...log,
          date: normalizeDate(log.date),
        }));
        const normalizedAbsences = absences.map((absence: Absence) => ({
          ...absence,
          date: normalizeDate(absence.date),
        }));
        setUsersData(users);
        setProjectsData(projects);
        setCustomersData(customers);
        setTimeLogsData(normalizedTimeLogs);
        setAbsencesData(normalizedAbsences);
      } catch (error) {
        console.error('Failed to load calendar data', error);
      }
    };
    loadCalendarData();
  }, [refreshKey, monthStart, monthEnd]);

  const sameUserId = (a: string | number, b: string | number) => {
    return a?.toString() === b?.toString();
  };

  const getAttendanceStatus = (userId: string, date: string): AttendanceStatus => {
    const hasTimeLog = timeLogsData.some(
      log => sameUserId(log.user_id, userId) && log.date === date
    );
    if (hasTimeLog) return 'Anwesend';

    const absence = absencesData.find(
      abs => sameUserId(abs.user_id, userId) && abs.date === date
    );
    if (absence) {
      return absence.type === 'Unentschuldigt' ? 'Unentschuldigt' : 'Entschuldigt';
    }

    return 'Sonstiges';
  };

  const users = isAdmin ? usersData : [user];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Anwesend':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Entschuldigt':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Unentschuldigt':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'Sonstiges':
        return 'bg-gray-100 text-gray-800 border-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getAbsenceTypeColor = (type: AbsenceType) => {
    switch (type) {
      case 'Krankheit':
        return 'bg-red-500'; // Rot für Krankheit
      case 'Urlaub':
        return 'bg-blue-500'; // Blau für Urlaub
      case 'Homeoffice':
        return 'bg-purple-500'; // Lila für Homeoffice
      case 'Schule':
        return 'bg-orange-500'; // Orange für Schule
      case 'Sonstiges':
        return 'bg-gray-500'; // Grau für Sonstiges
      default:
        return 'bg-yellow-500'; // Gelb als Fallback
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalender</h1>
          <p className="text-gray-600 mt-1">Anwesenheit und Abwesenheitsmeldungen</p>
        </div>
      </div>

      {showAbsenceForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Abwesenheitsnotiz erstellen</h2>
            <form onSubmit={handleSubmitAbsence} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={absenceStartDate}
                    onChange={(e) => setAbsenceStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={absenceEndDate}
                    min={absenceStartDate}
                    onChange={(e) => setAbsenceEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
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
                  <option value="Urlaub">Urlaub</option>
                  <option value="Homeoffice">Homeoffice</option>
                  <option value="Schule">Schule</option>
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

      {isAdmin && (
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setShowVacationModal(true)}
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Urlaub eintragen (Zeitraum)
          </button>
          <button
            onClick={() => setShowSchoolModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Schultage eintragen (Zeitraum)
          </button>
        </div>
      )}

      {isAdmin && showVacationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Urlaub eintragen (Zeitraum)</h2>
              <button
                onClick={() => setShowVacationModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVacationRange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitarbeiter
                </label>
                <select
                  value={vacationEmployeeId}
                  onChange={(e) => setVacationEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Bitte auswählen...</option>
                  {usersData.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={vacationStartDate}
                    onChange={(e) => setVacationStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={vacationEndDate}
                    min={vacationStartDate}
                    onChange={(e) => setVacationEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund (optional)
                </label>
                <textarea
                  value={vacationReason}
                  onChange={(e) => setVacationReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg h-20"
                  placeholder="Optionaler Grund für Urlaub"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Urlaub speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setVacationEmployeeId('');
                    setVacationStartDate(format(new Date(), 'yyyy-MM-dd'));
                    setVacationEndDate(format(new Date(), 'yyyy-MM-dd'));
                    setVacationReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Zurücksetzen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isAdmin && showSchoolModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Schultage eintragen (Zeitraum)</h2>
              <button
                onClick={() => setShowSchoolModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSchoolRange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mitarbeiter
                </label>
                <select
                  value={schoolEmployeeId}
                  onChange={(e) => setSchoolEmployeeId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Bitte auswählen...</option>
                  {usersData.map(u => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Startdatum
                  </label>
                  <input
                    type="date"
                    value={schoolStartDate}
                    onChange={(e) => setSchoolStartDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enddatum
                  </label>
                  <input
                    type="date"
                    value={schoolEndDate}
                    min={schoolStartDate}
                    onChange={(e) => setSchoolEndDate(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grund (optional)
                </label>
                <textarea
                  value={schoolReason}
                  onChange={(e) => setSchoolReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg h-20"
                  placeholder="Optionaler Grund für Schule"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600"
                >
                  Schultage speichern
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSchoolEmployeeId('');
                    setSchoolStartDate(format(new Date(), 'yyyy-MM-dd'));
                    setSchoolEndDate(format(new Date(), 'yyyy-MM-dd'));
                    setSchoolReason('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Zurücksetzen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Legende</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span className="text-sm text-gray-700">Anwesend</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500"></div>
            <span className="text-sm text-gray-700">Krankheit</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-500"></div>
            <span className="text-sm text-gray-700">Urlaub</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-purple-500"></div>
            <span className="text-sm text-gray-700">Homeoffice</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-orange-500"></div>
            <span className="text-sm text-gray-700">Schule</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500"></div>
            <span className="text-sm text-gray-700">Sonstiges</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500 border-2 border-red-700"></div>
            <span className="text-sm text-gray-700">Unentschuldigt</span>
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
                    const holidayName = getHamburgHoliday(day);
                    const isHoliday = Boolean(holidayName);
                    const isDisabled = isWeekendDay;
                    const dayTimeLogs = timeLogsData.filter(
                      log => sameUserId(log.user_id, employee.id) && log.date === dateStr
                    );
                    const hasTimeLog = dayTimeLogs.length > 0;
                    
                    const status = getAttendanceStatus(employee.id, dateStr);
                    
                    // Get absence to check type
                    const dayAbsence = absencesData.find(
                      (abs) => sameUserId(abs.user_id, employee.id) && abs.date === dateStr
                    );
                    
                    // Determine color based on absence type or status
                    let statusColor = 'bg-gray-300'; // Default for weekend/future
                    let titleText = '';

                    if (dayAbsence) {
                      if (dayAbsence.type === 'Unentschuldigt') {
                        statusColor = 'bg-red-600 ring-2 ring-red-900';
                        titleText = 'Unentschuldigt gefehlt';
                      } else {
                        statusColor = getAbsenceTypeColor(dayAbsence.type);
                        titleText = `Entschuldigt: ${dayAbsence.type}`;
                      }
                    } else if (hasTimeLog) {
                      statusColor = 'bg-green-500';
                      titleText = 'Anwesend';
                    } else if (isHoliday) {
                      statusColor = 'bg-gray-400';
                      titleText = holidayName ? `Feiertag: ${holidayName}` : 'Feiertag';
                    } else if (isWeekendDay) {
                      statusColor = 'bg-gray-300';
                      titleText = 'Wochenende';
                    } else if (isFutureDay) {
                      statusColor = 'bg-gray-300';
                      titleText = 'Zukünftiger Tag';
                    } else if (status === 'Entschuldigt') {
                      statusColor = 'bg-yellow-500';
                      titleText = 'Entschuldigt';
                    } else if (status === 'Unentschuldigt') {
                      statusColor = 'bg-red-600 ring-2 ring-red-900';
                      titleText = 'Unentschuldigt gefehlt';
                    } else if (status === 'Sonstiges') {
                      statusColor = 'bg-gray-500';
                      titleText = 'Sonstiges';
                    } else {
                      statusColor = 'bg-green-500';
                      titleText = 'Anwesend';
                    }

                    return (
                      <td
                        key={day.toISOString()}
                        className={`p-2 text-center ${
                          isSameDay(day, new Date()) ? 'bg-blue-50' : ''
                        } ${isFutureDay || isWeekendDay ? 'opacity-50' : ''}`}
                      >
                        <div
                          onClick={() => {
                            if (isAdmin && !isDisabled) {
                              setSelectedDay({ date: dateStr, userId: employee.id });
                              setShowDayDetailsModal(true);
                            } else if (!isAdmin && !isDisabled) {
                              const employeeAbsence = absencesData.find(
                                (abs) => sameUserId(abs.user_id, employee.id) && abs.date === dateStr
                              );
                              const employeeHasTimeLog = timeLogsData.some(
                                (log) => sameUserId(log.user_id, employee.id) && log.date === dateStr
                              );

                              let initialStatus: EmployeeDayStatus = '';
                              if (employeeAbsence?.type === 'Homeoffice') initialStatus = 'Homeoffice';
                              if (employeeAbsence?.type === 'Schule') initialStatus = 'Schule';
                              if (employeeAbsence?.type === 'Krankheit') initialStatus = 'Krankheit';
                              if (employeeAbsence?.type === 'Sonstiges') initialStatus = 'Sonstiges';
                              if (employeeHasTimeLog) initialStatus = 'Anwesend';

                              setSelectedDay({ date: dateStr, userId: employee.id });
                              setEmployeeDayStatus(initialStatus);
                              setEmployeeDayReason(employeeAbsence?.reason || '');
                              setShowEmployeeDayModal(true);
                            }
                          }}
                          className={`w-6 h-6 rounded mx-auto ${statusColor} ${
                            !isDisabled ? 'cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all' : ''
                          }`}
                          title={titleText}
                        >
                          {status === 'Unentschuldigt' && (
                            <span className="text-white text-[10px] font-bold leading-none">✕</span>
                          )}
                        </div>
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
              const employee = usersData.find(u => u.id.toString() === selectedDay.userId.toString());
              const status = getAttendanceStatus(selectedDay.userId, selectedDay.date);
              const timeLogs = timeLogsData.filter(
                (log) => sameUserId(log.user_id, selectedDay.userId) && log.date === selectedDay.date
              );
              const dayAbsence = absencesData.find(
                (abs) => sameUserId(abs.user_id, selectedDay.userId) && abs.date === selectedDay.date
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
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-4">
                          <h4 className="font-semibold text-gray-900">Status ändern</h4>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Neuer Status
                            </label>
                            <select
                              value={targetStatus}
                              onChange={(e) => setTargetStatus(e.target.value as typeof targetStatus)}
                              className="w-full px-4 py-2 border rounded-lg"
                            >
                              <option value="Anwesend">Anwesend</option>
                              <option value="Entschuldigt">Entschuldigt</option>
                              <option value="Unentschuldigt">Unentschuldigt</option>
                            </select>
                          </div>

                          {targetStatus === 'Entschuldigt' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Abwesenheitstyp
                                </label>
                                <select
                                  value={targetAbsenceType}
                                  onChange={(e) => setTargetAbsenceType(e.target.value as AbsenceType)}
                                  className="w-full px-4 py-2 border rounded-lg"
                                >
                                  <option value="Krankheit">Krankheit</option>
                                  <option value="Urlaub">Urlaub</option>
                                  <option value="Homeoffice">Homeoffice</option>
                                  <option value="Schule">Schule</option>
                                  <option value="Sonstiges">Sonstiges</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                  Grund (optional)
                                </label>
                                <textarea
                                  value={targetReason}
                                  onChange={(e) => setTargetReason(e.target.value)}
                                  className="w-full px-4 py-2 border rounded-lg h-20"
                                  placeholder="Grund für Abwesenheit..."
                                />
                              </div>
                            </div>
                          )}

                          {targetStatus === 'Unentschuldigt' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Beschreibung *
                              </label>
                              <textarea
                                value={targetReason}
                                onChange={(e) => setTargetReason(e.target.value)}
                                className="w-full px-4 py-2 border rounded-lg h-20"
                                placeholder="Warum unentschuldigt?"
                                required
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <button
                              onClick={async () => {
                                if (targetStatus === 'Anwesend') {
                                  await store.deleteAbsencesByUserAndDate(selectedDay.userId, selectedDay.date);
                                  const dayTimeLogs = timeLogsData.filter(
                                    (log) => sameUserId(log.user_id, selectedDay.userId) && log.date === selectedDay.date
                                  );
                                  if (dayTimeLogs.length === 0) {
                                    await store.createTimeLog({
                                      user_id: selectedDay.userId,
                                      customer_name: 'Statusmeldung',
                                      date: selectedDay.date,
                                      hours: 0,
                                      notes: 'Tagesstatus: Anwesend',
                                    });
                                  }
                                } else if (targetStatus === 'Entschuldigt') {
                                  timeLogs.forEach(log => store.deleteTimeLog(log.id));
                                  await store.createAbsence({
                                    user_id: selectedDay.userId,
                                    date: selectedDay.date,
                                    type: targetAbsenceType,
                                    reason: targetReason.trim() || '-',
                                  });
                                } else {
                                  if (!targetReason.trim()) {
                                    alert('Bitte eine Beschreibung für Unentschuldigt eingeben');
                                    return;
                                  }
                                  timeLogs.forEach(log => store.deleteTimeLog(log.id));
                                  await store.createAbsence({
                                    user_id: selectedDay.userId,
                                    date: selectedDay.date,
                                    type: 'Unentschuldigt',
                                    reason: targetReason.trim(),
                                  });
                                }
                                await store.initialize();
                                setIsChangingStatus(false);
                                setShowDayDetailsModal(false);
                                setSelectedDay(null);
                                setTargetReason('');
                                setRefreshKey(prev => prev + 1);
                              }}
                              className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
                            >
                              Speichern
                            </button>
                            <button
                              onClick={() => {
                                setIsChangingStatus(false);
                                setTargetReason('');
                              }}
                              className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                            >
                              Abbrechen
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

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
                    {timeLogs.length === 0 && dayAbsence?.type === 'Unentschuldigt' && (
                      <div>
                        {!isAddingRetroactiveAbsence ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <X className="w-8 h-8 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Unentschuldigt gefehlt</h3>
                            <p className="text-gray-600 mb-4">
                              Keine Statusmeldung und keine Abwesenheitsmeldung für diesen Tag.
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
                                <option value="Homeoffice">Homeoffice</option>
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
                                  onClick={async () => {
                                    await store.createAbsence({
                                      user_id: selectedDay.userId,
                                      date: selectedDay.date,
                                      type: retroAbsenceType,
                                      reason: retroAbsenceReason.trim() || '-',
                                    });
                                    await store.initialize();
                                    setShowDayDetailsModal(false);
                                    setSelectedDay(null);
                                    setIsAddingRetroactiveAbsence(false);
                                    setRetroAbsenceReason('');
                                    setRefreshKey(prev => prev + 1);
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

                    {timeLogs.length === 0 && !dayAbsence && status === 'Sonstiges' && (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Kein Status für diesen Tag vorhanden.</p>
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

      {/* Employee Day Status Modal */}
      {showEmployeeDayModal && selectedDay && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-lg">
            <div className="p-6 border-b bg-gray-50 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Tagesstatus eintragen</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {format(new Date(selectedDay.date), 'EEEE, dd. MMMM yyyy', { locale: de })}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowEmployeeDayModal(false);
                  setSelectedDay(null);
                  setEmployeeDayStatus('');
                  setEmployeeDayReason('');
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['Anwesend', 'Homeoffice', 'Schule', 'Krankheit', 'Sonstiges'] as const).map((status) => (
                    <button
                      key={status}
                      type="button"
                      onClick={() => setEmployeeDayStatus(status)}
                      className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        employeeDayStatus === status
                          ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {employeeDayStatus && employeeDayStatus !== 'Anwesend' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Grund (optional)
                  </label>
                  <textarea
                    value={employeeDayReason}
                    onChange={(e) => setEmployeeDayReason(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg h-20"
                    placeholder="Optionaler Grund"
                  />
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50 flex gap-2">
              <button
                onClick={async () => {
                  if (!selectedDay || !employeeDayStatus) {
                    alert('Bitte einen Status auswählen.');
                    return;
                  }

                  const dayAbsences = absencesData.filter(
                    (abs) => sameUserId(abs.user_id, selectedDay.userId) && abs.date === selectedDay.date
                  );
                  const dayTimeLogs = timeLogsData.filter(
                    (log) => sameUserId(log.user_id, selectedDay.userId) && log.date === selectedDay.date
                  );

                  if (employeeDayStatus === 'Anwesend') {
                    for (const absence of dayAbsences) {
                      await store.deleteAbsence(absence.id);
                    }
                    if (dayTimeLogs.length === 0) {
                      await store.createTimeLog({
                        user_id: selectedDay.userId,
                        customer_name: 'Statusmeldung',
                        date: selectedDay.date,
                        hours: 0,
                        notes: 'Tagesstatus: Anwesend',
                      });
                    }
                  } else {
                    for (const log of dayTimeLogs) {
                      await store.deleteTimeLog(log.id);
                    }
                    const reason = employeeDayReason.trim() || '-';
                    const absenceType = employeeDayStatus as Extract<AbsenceType, 'Homeoffice' | 'Schule' | 'Krankheit' | 'Sonstiges'>;

                    if (dayAbsences.length > 0) {
                      await store.updateAbsence(dayAbsences[0].id, { type: absenceType, reason });
                    } else {
                      await store.createAbsence({
                        user_id: selectedDay.userId,
                        date: selectedDay.date,
                        type: absenceType,
                        reason,
                      });
                    }
                  }

                  await store.initialize();
                  setRefreshKey(prev => prev + 1);
                  setShowEmployeeDayModal(false);
                  setSelectedDay(null);
                  setEmployeeDayStatus('');
                  setEmployeeDayReason('');
                }}
                className="flex-1 bg-[#1e3a8a] text-white py-2 rounded-lg hover:bg-blue-700"
              >
                Speichern
              </button>
              <button
                onClick={() => {
                  setShowEmployeeDayModal(false);
                  setSelectedDay(null);
                  setEmployeeDayStatus('');
                  setEmployeeDayReason('');
                }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
              >
                Abbrechen
              </button>
            </div>
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
              const myAbsences = absencesData.filter(a => a.user_id === user.id);
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
                  {usersData.map(u => (
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
                    const allAbsences = absencesData;
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
              let allAbsences = absencesData;
              
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
                            const employee = usersData.find(u => u.id === absence.user_id);
                            return (
                              <tr key={absence.id} className="border-b last:border-0 hover:bg-gray-50">
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {employee?.full_name}
                                </td>
                                <td className="py-3 px-4 text-sm text-gray-900">
                                  {format(new Date(absence.date), 'dd.MM.yyyy')}
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${getAbsenceTypeColor(absence.type)}`}>
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
