/**
 * Gets the current date string (YYYY-MM-DD)
 */
export function getCurrentDateStr(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Generates a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Gets week number of a date
 */
export function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

/**
 * Format date to Chinese string
 */
export function formatDateCN(dateStr: string): string {
  if (!dateStr) return '';
  const normalized = normalizeDateStr(dateStr);
  if (!normalized) return '';
  const d = new Date(normalized);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

/**
 * Normalizes a date string from various formats (e.g., YYYY/MM/DD, YYYY.MM.DD, YYYY-M-D) to strictly YYYY-MM-DD.
 * If invalid or empty, returns an empty string.
 */
export function normalizeDateStr(dateStr: any): string {
  if (dateStr === null || dateStr === undefined) return '';
  const str = String(dateStr).trim();
  if (!str) return '';

  // 1. Try to match YYYY/MM/DD or YYYY.MM.DD or YYYY-MM-DD or YYYY年MM月DD日
  // Match groups: 1=year, 2=month, 3=day
  const regex = /^(\d{4})[-/.\u4e00-\u9fa5]\s*(\d{1,2})\s*[-/.\u4e00-\u9fa5]\s*(\d{1,2})\s*[\u4e00-\u9fa5]?$/;
  const match = str.match(regex);
  if (match) {
    const year = match[1];
    const month = match[2].padStart(2, '0');
    const day = match[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // 2. Try JavaScript Date parsing as fallback
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  } catch (e) {
    // ignore
  }

  return '';
}

/**
 * Get days between two dates
 */
export function getDaysBetween(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}
