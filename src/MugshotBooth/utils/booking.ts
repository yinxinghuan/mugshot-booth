// Mugshot Booth — booking helpers (case numbers, dates, verdicts).

/** Generate a fresh case number — sequential per user (offset by user's count). */
export function caseNumber(count: number): string {
  const year = new Date().getFullYear();
  const seq = String(count + 1).padStart(5, '0');
  return `ALT-${year}-${seq}`;
}

/** Today, formatted "2026-05-23". */
export function bookingDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/** New random mugshot id. */
export function newMugshotId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/** Pick a verdict — weighted toward GUILTY for the dark-humor punch. */
export function rollVerdict(): 'GUILTY' | 'AWAITING TRIAL' | 'FREED ON BAIL' {
  const r = Math.random();
  if (r < 0.6) return 'GUILTY';
  if (r < 0.9) return 'AWAITING TRIAL';
  return 'FREED ON BAIL';
}

/** Prepend a fresh mugshot to history, capped at 12. */
export function prependMugshot<T>(prev: T[] | undefined, m: T): T[] {
  return [m, ...(prev ?? [])].slice(0, 12);
}
