import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { Clock, AlertCircle, FolderKanban, AlertTriangle, X } from 'lucide-react';
import { eachDayOfInterval, format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AttendanceQuickActions } from '../components/AttendanceQuickActions';
import { getHamburgWorkdaysForYear } from '../utils/attendanceYear';

export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationEndDate, setVacationEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationReason, setVacationReason] = useState('');
  const [schoolStartDate, setSchoolStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolEndDate, setSchoolEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolReason, setSchoolReason] = useState('');
  const [isFillingYear, setIsFillingYear] = useState(false);

  if (!user) return null;
  const currentYear = new Date().getFullYear();

  const allUsers = store.getUsers();
  const allProjects = store.getProjects();
  const allTasks = store.getTasks();

  const handleCreateVacation = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(vacationStartDate);
    const end = new Date(vacationEndDate);
    const days = eachDayOfInterval({ start, end });
    const failedDates: string[] = [];

    for (const day of days) {
      const dateString = format(day, 'yyyy-MM-dd');
      try {
        await store.createAbsence({
          user_id: user.id,
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

    setVacationStartDate(format(new Date(), 'yyyy-MM-dd'));
    setVacationEndDate(format(new Date(), 'yyyy-MM-dd'));
    setVacationReason('');
    setShowVacationModal(false);
    await store.initialize();
  };

  const handleCreateSchoolRange = async (e: React.FormEvent) => {
    e.preventDefault();
    const start = new Date(schoolStartDate);
    const end = new Date(schoolEndDate);
    const days = eachDayOfInterval({ start, end });
    const failedDates: string[] = [];

    for (const day of days) {
      const dateString = format(day, 'yyyy-MM-dd');
      try {
        await store.createAbsence({
          user_id: user.id,
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

    setSchoolStartDate(format(new Date(), 'yyyy-MM-dd'));
    setSchoolEndDate(format(new Date(), 'yyyy-MM-dd'));
    setSchoolReason('');
    setShowSchoolModal(false);
    await store.initialize();
  };

  const handleFillYearAsPresent = async () => {
    const confirmed = window.confirm(
      `Alle Werktage im Jahr ${currentYear} als Anwesend eintragen (ohne Hamburger Feiertage)?`
    );
    if (!confirmed) return;

    setIsFillingYear(true);
    let created = 0;
    let skipped = 0;

    try {
      const workdays = getHamburgWorkdaysForYear(currentYear);
      for (const date of workdays) {
        const existingLogs = store.getTimeLogsByUserAndDate(user.id, date);
        await store.deleteAbsencesByUserAndDate(user.id, date);

        if (existingLogs.length > 0) {
          skipped += 1;
          continue;
        }

        try {
          await store.createTimeLog({
            user_id: user.id,
            customer_name: 'Statusmeldung',
            date,
            hours: 0,
            notes: `Jahreseintrag ${currentYear}: Anwesend`,
          });
          created += 1;
        } catch {
          skipped += 1;
        }
      }

      await store.initialize();
      alert(`Jahreseintrag abgeschlossen. Neu gesetzt: ${created}, übersprungen: ${skipped}.`);
    } finally {
      setIsFillingYear(false);
    }
  };

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

      {!isAdmin && (
        <div className="mb-8 flex flex-wrap gap-3">
          <button
            onClick={() => setShowVacationModal(true)}
            className="bg-[#1e3a8a] text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Urlaub eintragen
          </button>
          <button
            onClick={() => setShowSchoolModal(true)}
            className="bg-orange-500 text-white px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors"
          >
            Schultage eintragen
          </button>
          <button
            onClick={handleFillYearAsPresent}
            disabled={isFillingYear}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isFillingYear ? 'Wird eingetragen...' : `Jahr ${currentYear} komplett anwesend`}
          </button>
        </div>
      )}

      {showVacationModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Urlaub eintragen</h2>
              <button
                onClick={() => setShowVacationModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateVacation} className="space-y-4">
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

      {showSchoolModal && !isAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Schultage eintragen</h2>
              <button
                onClick={() => setShowSchoolModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateSchoolRange} className="space-y-4">
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

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
        </div>
      )}
    </div>
  );
}
