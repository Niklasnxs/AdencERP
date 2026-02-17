import { format } from 'date-fns';
import { store } from '../store';
import { getHamburgWorkdaysForMonth } from './attendanceYear';

interface FillMonthResult {
  created: number;
  skipped: number;
  cleanedAbsences: number;
}

export async function fillMonthAsPresentForUser(userId: string, monthDate: Date): Promise<FillMonthResult> {
  const year = monthDate.getFullYear();
  const monthIndex = monthDate.getMonth();
  const workdays = getHamburgWorkdaysForMonth(year, monthIndex);
  const monthPrefix = format(monthDate, 'yyyy-MM');

  const existingLogDates = new Set(
    store
      .getTimeLogsByUser(userId)
      .filter((log) => log.date.startsWith(monthPrefix))
      .map((log) => log.date)
  );

  const absencesByDate = new Map<string, string[]>();
  for (const absence of store.getAbsencesByUser(userId)) {
    if (!absence.date.startsWith(monthPrefix)) continue;
    const ids = absencesByDate.get(absence.date) || [];
    ids.push(absence.id);
    absencesByDate.set(absence.date, ids);
  }

  let created = 0;
  let skipped = 0;
  let cleanedAbsences = 0;

  for (const date of workdays) {
    if (existingLogDates.has(date)) {
      skipped += 1;
      continue;
    }

    const absenceIds = absencesByDate.get(date) || [];
    for (const absenceId of absenceIds) {
      await store.deleteAbsence(absenceId);
      cleanedAbsences += 1;
    }

    await store.createTimeLog({
      user_id: userId,
      customer_name: 'Statusmeldung',
      date,
      hours: 0,
      notes: `Monatsbestätigung ${monthPrefix}: Bestätigt anwesend`,
    });
    created += 1;
  }

  return { created, skipped, cleanedAbsences };
}
