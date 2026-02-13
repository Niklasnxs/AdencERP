import { addDays, format, isWeekend } from 'date-fns';

function getEasterSunday(year: number): Date {
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
}

function getHamburgHolidaySet(year: number): Set<string> {
  const easter = getEasterSunday(year);

  const goodFriday = new Date(easter);
  goodFriday.setDate(goodFriday.getDate() - 2);

  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  const ascensionDay = new Date(easter);
  ascensionDay.setDate(ascensionDay.getDate() + 39);

  const whitMonday = new Date(easter);
  whitMonday.setDate(whitMonday.getDate() + 50);

  return new Set<string>([
    format(new Date(year, 0, 1), 'yyyy-MM-dd'),
    format(goodFriday, 'yyyy-MM-dd'),
    format(easterMonday, 'yyyy-MM-dd'),
    format(new Date(year, 4, 1), 'yyyy-MM-dd'),
    format(ascensionDay, 'yyyy-MM-dd'),
    format(whitMonday, 'yyyy-MM-dd'),
    format(new Date(year, 9, 3), 'yyyy-MM-dd'),
    format(new Date(year, 9, 31), 'yyyy-MM-dd'),
    format(new Date(year, 11, 25), 'yyyy-MM-dd'),
    format(new Date(year, 11, 26), 'yyyy-MM-dd'),
  ]);
}

export function getHamburgWorkdaysForYear(year: number): string[] {
  const holidays = getHamburgHolidaySet(year);
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);
  const result: string[] = [];

  for (let day = new Date(start); day <= end; day = addDays(day, 1)) {
    if (isWeekend(day)) {
      continue;
    }
    const dateStr = format(day, 'yyyy-MM-dd');
    if (holidays.has(dateStr)) {
      continue;
    }
    result.push(dateStr);
  }

  return result;
}
