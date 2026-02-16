import { useState } from 'react';
import { useAuth } from '../AuthContext';
import { store } from '../store';
import { AlertTriangle, X, Mail, Video, Clock } from 'lucide-react';
import { eachDayOfInterval, format } from 'date-fns';
import { fillYearAsPresentForUser } from '../utils/fillAttendanceYear';
import { APP_NAME } from '../config/branding';
import { GENERAL_ZOOM_URL, MARVIN_ZOOM_URL, MATTERMOST_ADENCE, MATTERMOST_NXS } from '../config/branding';

export function AdminDashboard() {
  const { user, isAdmin } = useAuth();
  const [showVacationModal, setShowVacationModal] = useState(false);
  const [showSchoolModal, setShowSchoolModal] = useState(false);
  const [vacationStartDate, setVacationStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationEndDate, setVacationEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [vacationReason, setVacationReason] = useState('');
  const [schoolStartDate, setSchoolStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolEndDate, setSchoolEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schoolReason, setSchoolReason] = useState('');
  const [showYearFillModal, setShowYearFillModal] = useState(false);
  const [yearFillUserId, setYearFillUserId] = useState('');
  const [isFillingYear, setIsFillingYear] = useState(false);

  if (!user || !isAdmin) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">Zugriff verweigert</p>
        </div>
      </div>
    );
  }
  const currentYear = new Date().getFullYear();
  const users = store.getUsers();

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

  const handleFillYearAsPresentForEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!yearFillUserId) {
      alert('Bitte Mitarbeiter auswählen');
      return;
    }

    setIsFillingYear(true);
    try {
      const result = await fillYearAsPresentForUser(yearFillUserId, currentYear);
      await store.initialize();
      setShowYearFillModal(false);
      setYearFillUserId('');
      alert(
        `Jahreseintrag abgeschlossen. Neu gesetzt: ${result.created}, übersprungen: ${result.skipped}, entfernte Abwesenheiten: ${result.cleanedAbsences}.`
      );
    } finally {
      setIsFillingYear(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">{APP_NAME}</h1>
        <p className="text-gray-600 mt-1">Anwesenheitsübersicht</p>
      </div>

      <div className="mb-8 rounded-xl border-2 border-amber-400 bg-amber-100 px-6 py-6 text-amber-900 shadow-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-7 h-7 mt-0.5 flex-shrink-0" />
          <p className="text-base sm:text-lg font-semibold leading-relaxed">
            Wichtig: Dieses Tool wird aktuell ausschließlich für die Anwesenheitsdokumentation genutzt
            (Anwesenheit, Anwesenheit Homeoffice, Schule, Krank, Urlaub, Unentschuldigt oder Arbeitsende). Zeiterfassung in Stunden
            ist vorerst deaktiviert.
          </p>
        </div>
      </div>

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
          onClick={() => setShowYearFillModal(true)}
          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Jahr {currentYear} komplett anwesend
        </button>
      </div>

      <div className="bg-white rounded-lg shadow mb-8">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Schnellzugriff</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            <button
              onClick={() => {
                window.open(MARVIN_ZOOM_URL, '_blank');
              }}
              className="flex items-center gap-4 p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors border border-green-200"
            >
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Zoomcall mit Marvin</h3>
                <p className="text-sm text-gray-600">Direkt beitreten</p>
              </div>
            </button>

            <button
              onClick={() => {
                window.open(GENERAL_ZOOM_URL, '_blank');
              }}
              className="flex items-center gap-4 p-4 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              <div className="w-12 h-12 bg-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Allghemeiner Zoom link</h3>
                <p className="text-sm text-gray-600">Zoom öffnen</p>
              </div>
            </button>

            <button
              onClick={() => {
                window.open(MATTERMOST_ADENCE.url, '_blank');
              }}
              className="flex items-center gap-4 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors border border-purple-200"
            >
              <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={MATTERMOST_ADENCE.logo} alt="ADence Logo" className="w-8 h-8 object-contain bg-white rounded" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">{MATTERMOST_ADENCE.name}</h3>
                <p className="text-sm text-gray-600">Mattermost öffnen</p>
              </div>
            </button>

            <button
              onClick={() => {
                window.open(MATTERMOST_NXS.url, '_blank');
              }}
              className="flex items-center gap-4 p-4 bg-violet-50 hover:bg-violet-100 rounded-lg transition-colors border border-violet-200"
            >
              <div className="w-12 h-12 bg-violet-600 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                <img src={MATTERMOST_NXS.logo} alt="NXS Logo" className="w-8 h-8 object-contain bg-white rounded" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">{MATTERMOST_NXS.name}</h3>
                <p className="text-sm text-gray-600">Mattermost öffnen</p>
              </div>
            </button>

            <button
              onClick={() => {
                if (user.stundenliste_link) {
                  window.open(user.stundenliste_link, '_blank');
                } else {
                  alert('Kein Stundenliste-Link hinterlegt.');
                }
              }}
              className="flex items-center gap-4 p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors border border-indigo-200"
            >
              <div className="w-12 h-12 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="text-left flex-1">
                <h3 className="font-semibold text-gray-900">Stundenliste</h3>
                <p className="text-sm text-gray-600">Link öffnen</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {showVacationModal && (
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

      {showSchoolModal && (
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

      {showYearFillModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Jahreseintrag Anwesenheit</h2>
              <button
                onClick={() => setShowYearFillModal(false)}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFillYearAsPresentForEmployee} className="space-y-4">
              <p className="text-sm text-gray-600">
                Es werden alle Werktage im Jahr {currentYear} als Anwesend gesetzt, Feiertage in Hamburg werden ausgelassen.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Benutzer
                </label>
                <select
                  value={yearFillUserId}
                  onChange={(e) => setYearFillUserId(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg"
                  required
                >
                  <option value="">Bitte auswählen...</option>
                  {users.map((selectedUser) => (
                    <option key={selectedUser.id} value={selectedUser.id}>
                      {selectedUser.full_name} ({selectedUser.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isFillingYear}
                  className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isFillingYear ? 'Wird eingetragen...' : 'Eintragen'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowYearFillModal(false)}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300"
                >
                  Abbrechen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
