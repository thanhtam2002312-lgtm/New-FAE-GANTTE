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

  // 1b. Try 8-digit compact date YYYYMMDD (e.g. 20240901)
  const match8 = str.match(/^(\d{4})(\d{2})(\d{2})$/);
  if (match8) {
    const y = parseInt(match8[1], 10);
    const m = parseInt(match8[2], 10);
    const d = parseInt(match8[3], 10);
    if (y >= 1990 && y <= 2100 && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${match8[1]}-${match8[2]}-${match8[3]}`;
    }
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

/**
 * Parses any currency / amount string into a numeric value.
 * Handles:
 * - "$10,000" -> 10000
 * - "2720" -> 2720
 * - "2,720.5" -> 2720.5
 * - "¥10,000" -> 10000
 * - "10k" / "10K" -> 10000
 * - "1.5M" / "1.5m" -> 1500000
 */
export function parseAmount(val: any): number {
  if (val === null || val === undefined) return 0;
  const str = String(val).trim();
  if (!str) return 0;

  // Check for K/k (thousands)
  const kMatch = str.match(/^([$¥€£]?)\s*([\d,.]+)\s*[kK]$/);
  if (kMatch) {
    const num = parseFloat(kMatch[2].replace(/,/g, ''));
    return isNaN(num) ? 0 : num * 1000;
  }

  // Check for M/m (millions)
  const mMatch = str.match(/^([$¥€£]?)\s*([\d,.]+)\s*[mM]$/);
  if (mMatch) {
    const num = parseFloat(mMatch[2].replace(/,/g, ''));
    return isNaN(num) ? 0 : num * 1000000;
  }

  // Clean currency symbols and commas
  const cleaned = str.replace(/[$¥€£\s,]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Formats a numeric amount to a standard currency string, e.g. "$2,720"
 */
export function formatAmount(val: number): string {
  if (val === 0) return '$0';
  if (Number.isInteger(val)) {
    return '$' + val.toLocaleString('en-US');
  }
  return '$' + val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/**
 * Calculates the total LTR amount from an array of PNs with socketTotalLtrAmt
 */
export function calculatePnTotalLtr(pns?: Array<{ socketTotalLtrAmt?: string }>): string {
  if (!pns || pns.length === 0) return '';
  let sum = 0;
  let hasAnyAmount = false;
  for (const pn of pns) {
    if (pn && pn.socketTotalLtrAmt !== undefined && String(pn.socketTotalLtrAmt).trim()) {
      const amt = parseAmount(pn.socketTotalLtrAmt);
      if (!isNaN(amt)) {
        sum += amt;
        hasAnyAmount = true;
      }
    }
  }
  if (!hasAnyAmount) return '';
  return formatAmount(sum);
}
