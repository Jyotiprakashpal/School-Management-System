export type ConfiguredDateFormat = "DD MMM YYYY" | "DD/MM/YYYY" | "MM/DD/YYYY";

const availableFormats: ConfiguredDateFormat[] = ["DD MMM YYYY", "DD/MM/YYYY", "MM/DD/YYYY"];
const defaultFormat: ConfiguredDateFormat = "DD MMM YYYY";
let configuredDateFormat = defaultFormat;
const listeners = new Set<(format: ConfiguredDateFormat) => void>();

export function getConfiguredDateFormat() {
  return configuredDateFormat;
}

export function setConfiguredDateFormat(value: string) {
  if (!availableFormats.includes(value as ConfiguredDateFormat)) return configuredDateFormat;
  const nextFormat = value as ConfiguredDateFormat;
  if (nextFormat === configuredDateFormat) return configuredDateFormat;

  configuredDateFormat = nextFormat;
  listeners.forEach((listener) => listener(configuredDateFormat));
  return configuredDateFormat;
}

export function subscribeToDateFormat(listener: (format: ConfiguredDateFormat) => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function formatConfiguredDate(value: string | Date, options?: { weekday?: "long" | "short"; timeZone?: string }) {
  let date: Date;
  if (value instanceof Date) {
    date = value;
  } else {
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    date = dateOnly
      ? new Date(Number(dateOnly[1]), Number(dateOnly[2]) - 1, Number(dateOnly[3]))
      : new Date(value);
  }

  if (Number.isNaN(date.getTime())) return "—";

  const dateParts = options?.timeZone
    ? new Intl.DateTimeFormat("en-US", { timeZone: options.timeZone, day: "2-digit", month: "2-digit", year: "numeric" }).formatToParts(date)
    : null;
  const getPart = (type: Intl.DateTimeFormatPartTypes, fallback: number) =>
    dateParts?.find((part) => part.type === type)?.value ?? String(fallback).padStart(2, "0");
  const day = options?.timeZone ? getPart("day", date.getDate()) : String(date.getDate()).padStart(2, "0");
  const month = options?.timeZone ? getPart("month", date.getMonth() + 1) : String(date.getMonth() + 1).padStart(2, "0");
  const year = options?.timeZone ? getPart("year", date.getFullYear()) : String(date.getFullYear());
  const dateTimeFormatOptions = options?.timeZone ? { timeZone: options.timeZone } : {};
  const formattedDate = configuredDateFormat === "DD MMM YYYY"
    ? `${day} ${new Intl.DateTimeFormat("en-IN", { month: "short", ...dateTimeFormatOptions }).format(date)} ${year}`
    : configuredDateFormat === "DD/MM/YYYY"
      ? `${day}/${month}/${year}`
      : `${month}/${day}/${year}`;
  const weekday = options?.weekday
    ? new Intl.DateTimeFormat("en-IN", { weekday: options.weekday, ...dateTimeFormatOptions }).format(date)
    : "";

  return weekday ? `${weekday}, ${formattedDate}` : formattedDate;
}

export function formatConfiguredDateTime(value: string | Date) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const time = new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);
  return `${formatConfiguredDate(date)}, ${time}`;
}
