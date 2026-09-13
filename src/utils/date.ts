export function nowISO(): string {
  return new Date().toISOString();
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatRelativeDate(iso: string): string {
  const now = new Date();
  const then = new Date(iso);
  const diffMs = now.getTime() - then.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  const isToday =
    now.getFullYear() === then.getFullYear() &&
    now.getMonth() === then.getMonth() &&
    now.getDate() === then.getDate();

  if (isToday) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffWeeks === 1) return "1 week ago";
  if (diffWeeks < 5) return `${diffWeeks} weeks ago`;
  if (diffMonths === 1) return "1 month ago";
  if (diffMonths < 12) return `${diffMonths} months ago`;
  if (diffYears === 1) return "1 year ago";
  return `${diffYears} years ago`;
}

const DATE_ONLY_PARTS = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Parses a YYYY-MM-DD string into a *local* date. `new Date("2026-03-12")`
 * would be parsed as UTC midnight and can display as the previous day west of
 * Greenwich, so the parts are passed to the constructor explicitly.
 */
export function parseISODateOnly(value: string): Date | null {
  const match = value.match(DATE_ONLY_PARTS);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  // Rejects rolled-over values such as 2026-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }
  return date;
}

export function formatDateOnly(value: string): string {
  const date = parseISODateOnly(value);
  if (!date) return "";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDayMonth(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * Renders a trip's date range compactly, collapsing the parts the two ends
 * share: "12 - 18 Mar 2026", "12 Mar - 3 Apr 2026", "28 Dec 2026 - 3 Jan 2027".
 * Either bound may be absent.
 */
export function formatDateRange(
  startDate: string | null,
  endDate: string | null
): string {
  const start = startDate ? parseISODateOnly(startDate) : null;
  const end = endDate ? parseISODateOnly(endDate) : null;

  if (!start && !end) return "";
  if (start && !end) return `From ${formatDateOnly(startDate ?? "")}`;
  if (!start && end) return `Until ${formatDateOnly(endDate ?? "")}`;
  if (!start || !end) return "";

  if (start.getTime() === end.getTime()) {
    return formatDateOnly(startDate ?? "");
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${start.getDate()} - ${formatDateOnly(endDate ?? "")}`;
  }
  if (sameYear) {
    return `${formatDayMonth(start)} - ${formatDateOnly(endDate ?? "")}`;
  }
  return `${formatDateOnly(startDate ?? "")} - ${formatDateOnly(endDate ?? "")}`;
}
