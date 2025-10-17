export function formatDateTime(value: string | Date) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function formatRelative(value: string | Date) {
  const temp = typeof value === "string" ? new Date(value) : value;
  const now = new Date();
  const diff = temp.getTime() - now.getTime();
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const minutes = Math.round(diff / 60000);
  const hours = Math.round(diff / 3600000);
  const days = Math.round(diff / 86400000);

  if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
  if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
  return formatter.format(days, "day");
}
