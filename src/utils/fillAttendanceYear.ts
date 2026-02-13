import { store } from '../store';
import { getHamburgWorkdaysForYear } from './attendanceYear';

interface FillYearResult {
  created: number;
  skipped: number;
  cleanedAbsences: number;
}

async function runWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>
): Promise<void> {
  let current = 0;

  async function next(): Promise<void> {
    const index = current;
    current += 1;
    if (index >= items.length) return;
    await worker(items[index]);
    await next();
  }

  const workers = Array.from({ length: Math.min(concurrency, items.length) }, () => next());
  await Promise.all(workers);
}

export async function fillYearAsPresentForUser(userId: string, year: number): Promise<FillYearResult> {
  const workdays = getHamburgWorkdaysForYear(year);
  const yearPrefix = `${year}-`;

  const existingLogDates = new Set(
    store
      .getTimeLogsByUser(userId)
      .filter((log) => log.date.startsWith(yearPrefix))
      .map((log) => log.date)
  );

  const absencesByDate = new Map<string, string[]>();
  for (const absence of store.getAbsencesByUser(userId)) {
    if (!absence.date.startsWith(yearPrefix)) continue;
    const ids = absencesByDate.get(absence.date) || [];
    ids.push(absence.id);
    absencesByDate.set(absence.date, ids);
  }

  let created = 0;
  let skipped = 0;
  let cleanedAbsences = 0;

  await runWithConcurrency(workdays, 12, async (date) => {
    if (existingLogDates.has(date)) {
      skipped += 1;
      return;
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
      notes: `Jahreseintrag ${year}: Anwesend`,
    });
    created += 1;
  });

  return { created, skipped, cleanedAbsences };
}
