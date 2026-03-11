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

  // "yesterday"
  if (/\byesterday\b/.test(lower)) {
    return toDateString(addDays(today, -1));
  }

  // "day before yesterday"
  if (/\bday before yesterday\b/.test(lower)) {
    return toDateString(addDays(today, -2));
  }

  // "day after tomorrow"
  if (/\bday after tomorrow\b/.test(lower)) {
    return toDateString(addDays(today, 2));
  }

  // "this weekend" → next Saturday
  if (/\bthis weekend\b/.test(lower) || /\bweekend\b/.test(lower)) {
    return toDateString(getNextDayOfWeek(today, 6)); // Saturday
  }

  // "last weekend" → previous Saturday
  if (/\blast weekend\b/.test(lower)) {
    return toDateString(getPrevDayOfWeek(today, 6));
  }

  // Day name matching — MUST come before "next week" / "next month"
  // so "next week sat" matches "sat" properly
  const dayNames = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const shortDayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

  for (let i = 0; i < dayNames.length; i++) {
    const full = dayNames[i];
    const short = shortDayNames[i];

    // "last week saturday", "last week sat"
    const lastWeekDayPattern = new RegExp(`\\blast\\s+week\\s+(?:${full}|${short})\\b`);
    if (lastWeekDayPattern.test(lower)) {
      const prevMonday = getPrevDayOfWeek(today, 1);
      const prevWeekMonday = addDays(prevMonday, -7);
      const daysFromMonday = (i - 1 + 7) % 7;
      return toDateString(addDays(prevWeekMonday, daysFromMonday));
    }

    // "last saturday", "last fri"
    const lastPattern = new RegExp(`\\blast\\s+(?:${full}|${short})\\b`);
    if (lastPattern.test(lower)) {
      return toDateString(getPrevDayOfWeek(today, i));
    }

    // "next week saturday", "next week sat"
    const nextWeekDayPattern = new RegExp(`\\bnext\\s+week\\s+(?:${full}|${short})\\b`);
    if (nextWeekDayPattern.test(lower)) {
      const nextMonday = getNextDayOfWeek(today, 1);
      const targetDay = i;
      const daysFromMonday = (targetDay - 1 + 7) % 7;
      return toDateString(addDays(nextMonday, daysFromMonday));
    }

    // "next saturday", "next fri"
    const nextPattern = new RegExp(`\\bnext\\s+(?:${full}|${short})\\b`);
    if (nextPattern.test(lower)) {
      const coming = getNextDayOfWeek(today, i);
      return toDateString(addDays(coming, 7));
    }

    // "this saturday", "this fri", or just "saturday", "fri"
    const thisPattern = new RegExp(`\\b(?:this\\s+)?(?:${full}|${short})\\b`);
    if (thisPattern.test(lower)) {
      return toDateString(getNextDayOfWeek(today, i));
    }
  }

  // "next week" (without a day name — already handled above with day names)
  if (/\bnext week\b/.test(lower)) {
    return toDateString(addDays(today, 7));
  }

  // "next month"
  if (/\bnext month\b/.test(lower)) {
    const d = new Date(today);
    d.setMonth(d.getMonth() + 1);
    return toDateString(d);
  }

  // "X days ago", "2days ago"
  const daysAgoMatch = lower.match(/\b(\d+)\s*days?\s+ago\b/);
  if (daysAgoMatch) {
    return toDateString(addDays(today, -parseInt(daysAgoMatch[1])));
  }

  // "X weeks ago", "2weeks ago"
  const weeksAgoMatch = lower.match(/\b(\d+)\s*weeks?\s+ago\b/);
  if (weeksAgoMatch) {
    return toDateString(addDays(today, -parseInt(weeksAgoMatch[1]) * 7));
  }

  // "X months ago"
  const monthsAgoMatch = lower.match(/\b(\d+)\s*months?\s+ago\b/);
  if (monthsAgoMatch) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - parseInt(monthsAgoMatch[1]));
    return toDateString(d);
  }

  // "last week" (without a day name)
  if (/\blast week\b/.test(lower)) {
    return toDateString(addDays(today, -7));
  }

  // "last month"
  if (/\blast month\b/.test(lower)) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - 1);
    return toDateString(d);
  }

  // "in X days" or "after X days" (with or without space before "days")
  const inDaysMatch = lower.match(/\b(?:in|after)\s+(\d+)\s*days?\b/);
  if (inDaysMatch) {
    return toDateString(addDays(today, parseInt(inDaysMatch[1])));
  }

  // "in X weeks" or "after X weeks"
  const inWeeksMatch = lower.match(/\b(?:in|after)\s+(\d+)\s*weeks?\b/);
  if (inWeeksMatch) {
    return toDateString(addDays(today, parseInt(inWeeksMatch[1]) * 7));
  }

  // Specific dates: "18th march", "march 18", etc.
  const monthNames: Record<string, number> = {
    jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
    apr: 3, april: 3, may: 4, jun: 5, june: 5,
    jul: 6, july: 6, aug: 7, august: 7, sep: 8, september: 8,
    oct: 9, october: 9, nov: 10, november: 10, dec: 11, december: 11,
  };
  const monthPattern = Object.keys(monthNames).join("|");

  // "18th march", "18 march", "18th of march"
  const dayFirstMatch = lower.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${monthPattern})\\b`));
  if (dayFirstMatch) {
    const day = parseInt(dayFirstMatch[1]);
    const month = monthNames[dayFirstMatch[2]];
    if (day >= 1 && day <= 31) {
      const d = new Date(today.getFullYear(), month, day);
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      return toDateString(d);
    }
  }

  // "march 18", "march 18th", "jan 5"
  const monthFirstMatch = lower.match(new RegExp(`\\b(${monthPattern})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (monthFirstMatch) {
    const month = monthNames[monthFirstMatch[1]];
    const day = parseInt(monthFirstMatch[2]);
    if (day >= 1 && day <= 31) {
      const d = new Date(today.getFullYear(), month, day);
      if (d < today) d.setFullYear(d.getFullYear() + 1);
      return toDateString(d);
    }
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

function getPrevDayOfWeek(from: Date, dayOfWeek: number): Date {
  const d = new Date(from);
  const diff = (d.getDay() - dayOfWeek + 7) % 7;
  d.setDate(d.getDate() - (diff === 0 ? 7 : diff));
  return d;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
