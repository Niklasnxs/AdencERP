import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { store } from '../store';
import type { AbsenceType } from '../types';

type QuickStatus =
  | 'Anwesend'
  | 'Krankheit'
  | 'Urlaub'
  | 'Homeoffice'
  | 'Schule'
  | 'Sonstiges'
  | 'Unentschuldigt';

function resolveStatus(userId: string, date: string): QuickStatus | null {
  const logs = store.getTimeLogsByUserAndDate(userId, date);
  if (logs.length > 0) return 'Anwesend';

  const absence = store.getAbsenceByUserAndDate(userId, date);
  if (!absence) return null;
  if (absence.type === 'Homeoffice') return 'Homeoffice';
  if (absence.type === 'Schule') return 'Schule';
  if (absence.type === 'Krankheit') return 'Krankheit';
  if (absence.type === 'Urlaub') return 'Urlaub';
  if (absence.type === 'Sonstiges') return 'Sonstiges';
  if (absence.type === 'Unentschuldigt') return 'Unentschuldigt';
  return null;
}

const buttonColors: Record<QuickStatus, { active: string; inactive: string }> = {
  Anwesend: {
    active: 'bg-green-500 text-white border-green-500',
    inactive: 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100',
  },
  Krankheit: {
    active: 'bg-red-500 text-white border-red-500',
    inactive: 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
  },
  Urlaub: {
    active: 'bg-blue-500 text-white border-blue-500',
    inactive: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
  },
  Homeoffice: {
    active: 'bg-purple-500 text-white border-purple-500',
    inactive: 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100',
  },
  Schule: {
    active: 'bg-orange-500 text-white border-orange-500',
    inactive: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100',
  },
  Sonstiges: {
    active: 'bg-gray-500 text-white border-gray-500',
    inactive: 'bg-gray-50 text-gray-700 border-gray-300 hover:bg-gray-100',
  },
  Unentschuldigt: {
    active: 'bg-red-700 text-white border-red-700',
    inactive: 'bg-red-50 text-red-800 border-red-300 hover:bg-red-100',
  },
};

export function AttendanceQuickActions({ userId }: { userId: string }) {
  const today = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [currentStatus, setCurrentStatus] = useState<QuickStatus | null>(() => resolveStatus(userId, today));
  const [savingStatus, setSavingStatus] = useState<QuickStatus | null>(null);

  const setTodayStatus = async (status: QuickStatus) => {
    setSavingStatus(status);

    try {
      const todayLogs = store.getTimeLogsByUserAndDate(userId, today);
      const todayAbsence = store.getAbsenceByUserAndDate(userId, today);

      if (status === 'Anwesend') {
        // Ensure no absence remains for this day so calendar color turns green.
        await store.deleteAbsencesByUserAndDate(userId, today);
        if (todayLogs.length === 0) {
          await store.createTimeLog({
            user_id: userId,
            customer_name: 'Statusmeldung',
            date: today,
            hours: 0,
            notes: 'Tagesstatus: Anwesend',
          });
        }
      } else {
        for (const log of todayLogs) {
          await store.deleteTimeLog(log.id);
        }

        const reason = todayAbsence?.reason || 'Per Dashboard gesetzt';
        const absenceType = status as Extract<
          AbsenceType,
          'Homeoffice' | 'Schule' | 'Krankheit' | 'Urlaub' | 'Sonstiges' | 'Unentschuldigt'
        >;

        if (todayAbsence) {
          await store.updateAbsence(todayAbsence.id, { type: absenceType, reason });
        } else {
          await store.createAbsence({
            user_id: userId,
            date: today,
            type: absenceType,
            reason,
          });
        }
      }

      setCurrentStatus(status);
    } finally {
      setSavingStatus(null);
    }
  };

  const buttons: QuickStatus[] = [
    'Anwesend',
    'Krankheit',
    'Urlaub',
    'Homeoffice',
    'Schule',
    'Sonstiges',
    'Unentschuldigt',
  ];

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Anwesenheit heute</h2>
      <p className="text-sm text-gray-600 mb-4">
        Status für {format(new Date(today), 'dd.MM.yyyy')} direkt setzen
      </p>
      <div className="flex flex-wrap gap-2">
        {buttons.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setTodayStatus(status)}
            disabled={savingStatus !== null}
            className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
              currentStatus === status
                ? buttonColors[status].active
                : buttonColors[status].inactive
            } ${savingStatus !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
