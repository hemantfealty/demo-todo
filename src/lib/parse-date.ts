/**
 * Parse natural language date references from a string.
 * Returns a YYYY-MM-DD string or null if no date found.
 */
export function parseDateFromText(text: string): string | null {
  const lower = text.toLowerCase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // "today"
  if (/\btoday\b/.test(lower)) {
    return toDateString(today);
  }

  // "tomorrow"
  if (/\btomorrow\b/.test(lower)) {
    return toDateString(addDays(today, 1));
  }

  // "day after tomorrow"
  if (/\bday after tomorrow\b/.test(lower)) {
    return toDateString(addDays(today, 2));
  }

  // "next week"
  if (/\bnext week\b/.test(lower)) {
    return toDateString(addDays(today, 7));
  }

  // "next month"
  if (/\bnext month\b/.test(lower)) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return toDateString(d);
  }

  // "this weekend" → next Saturday
  if (/\bthis weekend\b/.test(lower) || /\bweekend\b/.test(lower)) {
    return toDateString(getNextDayOfWeek(today, 6)); // Saturday
  }

  // "this <day>" or "next <day>" or just "<day>"
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  for (let i = 0; i < dayNames.length; i++) {
    const nextPattern = new RegExp(`\\bnext\\s+${dayNames[i]}\\b`);
    const thisPattern = new RegExp(`\\b(this\\s+)?${dayNames[i]}\\b`);

    if (nextPattern.test(lower)) {
      // "next friday" = the friday AFTER the coming one
      const coming = getNextDayOfWeek(today, i);
      return toDateString(addDays(coming, 7));
    }

    if (thisPattern.test(lower)) {
      // "this friday" or just "friday" = the coming one
      return toDateString(getNextDayOfWeek(today, i));
    }
  }

  // "in X days"
  const inDaysMatch = lower.match(/\bin\s+(\d+)\s+days?\b/);
  if (inDaysMatch) {
    return toDateString(addDays(today, parseInt(inDaysMatch[1])));
  }

  // "in X weeks"
  const inWeeksMatch = lower.match(/\bin\s+(\d+)\s+weeks?\b/);
  if (inWeeksMatch) {
    return toDateString(addDays(today, parseInt(inWeeksMatch[1]) * 7));
  }

  return null;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function getNextDayOfWeek(from: Date, dayOfWeek: number): Date {
  const d = new Date(from);
  const diff = (dayOfWeek - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + (diff === 0 ? 7 : diff));
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
