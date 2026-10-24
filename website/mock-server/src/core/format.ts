// Bildiriş mətnləri üçün tarix formatı (Azərbaycan dili, Bakı vaxtı).

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avqust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'];

/** '2026-09-22' → '22 sentyabr 2026' */
export function azDate(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}
