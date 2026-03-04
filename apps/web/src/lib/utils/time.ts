function formatRelativeUnit(value: number, unit: Intl.RelativeTimeFormatUnit) {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(value, unit);
}

export function formatRelativeTime(isoDate: string) {
  const targetDate = new Date(isoDate);
  const elapsedMilliseconds = targetDate.getTime() - Date.now();
  const elapsedMinutes = Math.round(elapsedMilliseconds / (1000 * 60));

  if (Math.abs(elapsedMinutes) < 60) {
    return formatRelativeUnit(elapsedMinutes, 'minute');
  }

  const elapsedHours = Math.round(elapsedMilliseconds / (1000 * 60 * 60));
  if (Math.abs(elapsedHours) < 24) {
    return formatRelativeUnit(elapsedHours, 'hour');
  }

  const elapsedDays = Math.round(elapsedMilliseconds / (1000 * 60 * 60 * 24));
  return formatRelativeUnit(elapsedDays, 'day');
}
