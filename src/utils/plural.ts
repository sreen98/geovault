/** Formats a count with its noun: 1 place, 2 places, 0 collections. */
export function pluralize(
  count: number,
  singular: string,
  plural?: string
): string {
  const noun = count === 1 ? singular : plural ?? `${singular}s`;
  return `${count} ${noun}`;
}
