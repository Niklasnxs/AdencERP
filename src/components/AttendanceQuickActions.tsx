import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { store } from '../store';
import type { AbsenceType } from '../types';

type QuickStatus = 'Anwesend' | 'Homeoffice' | 'Schule' | 'Krankheit';

function resolveStatus(userId: string, date: string): QuickStatus | null {
  const logs = store.getTimeLogsByUserAndDate(userId, date);
  if (logs.length > 0) return 'Anwesend';

  const absence = store.getAbsenceByUserAndDate(userId, date);
  if (!absence) return null;
  if (absence.type === 'Homeoffice') return 'Homeoffice';
  if (absence.type === 'Schule') return 'Schule';
  if (absence.type === 'Krankheit') return 'Krankheit';
  return null;
}

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
        if (todayAbsence) {
          await store.deleteAbsence(todayAbsence.id);
        }
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
        const absenceType = status as Extract<AbsenceType, 'Homeoffice' | 'Schule' | 'Krankheit'>;

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

  const buttons: QuickStatus[] = ['Anwesend', 'Homeoffice', 'Krankheit', 'Schule'];

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
                ? 'bg-[#1e3a8a] text-white border-[#1e3a8a]'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            } ${savingStatus !== null ? 'opacity-60 cursor-not-allowed' : ''}`}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
}
