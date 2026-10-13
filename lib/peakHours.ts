import type { ActivityLogRecord } from "@/lib/types/schema";

export type TrafficMetric = "arrivals" | "departures";
export type TrafficRange = "today" | "7d" | "30d";
export type HourlyCount = { hour: number; count: number };

const DAY_MS = 24 * 60 * 60 * 1000;
const HOURS = Array.from({ length: 24 }, (_, hour) => hour);

const DAYS_IN_RANGE: Record<TrafficRange, number> = { today: 1, "7d": 7, "30d": 30 };

/**
 * timeOf — Higher-Order Function
 * Picks which timestamp a metric reads: park scans for arrivals, exit scans
 * for departures. Returns a plain row -> time accessor.
 */
export const timeOf =
  (metric: TrafficMetric) =>
  (row: ActivityLogRecord): number | null =>
    metric === "arrivals" ? row.parkedAt : row.exitedAt;

/**
 * Start of the range as epoch ms, counted in whole local days back from
 * `now`. Pure: `now` is passed in rather than read from the clock.
 */
export const rangeStart = (range: TrafficRange, now: number): number => {
  const today = new Date(now);
  // Built fresh from its parts rather than by mutating `today` with setHours.
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  return midnight.getTime() - (DAYS_IN_RANGE[range] - 1) * DAY_MS;
};

/** inRange — Higher-Order Function: closes over the bounds, returns a test. */
export const inRange =
  (start: number, end: number) =>
  (time: number | null): time is number =>
    time !== null && time >= start && time <= end;

/** Tallies times into 24 local-hour buckets. Every hour is present, even at 0. */
export const countByHour = (times: readonly number[]): HourlyCount[] => {
  const hours = times.map((time) => new Date(time).getHours());
  return HOURS.map((hour) => ({
    hour,
    count: hours.filter((h) => h === hour).length,
  }));
};

/**
 * The full pipeline the chart reads: rows -> times for the metric -> those
 * inside the range -> hourly buckets. Pure; the input rows are untouched.
 */
export const hourlyTraffic = (
  rows: readonly ActivityLogRecord[],
  metric: TrafficMetric,
  range: TrafficRange,
  now: number
): HourlyCount[] =>
  countByHour(rows.map(timeOf(metric)).filter(inRange(rangeStart(range, now), now)));

/** Busiest hour; the earliest wins a tie. Null when nothing was logged. */
export const peakOf = (counts: readonly HourlyCount[]): HourlyCount | null =>
  counts.reduce<HourlyCount | null>(
    (best, entry) => (entry.count > (best?.count ?? 0) ? entry : best),
    null
  );

export const totalOf = (counts: readonly HourlyCount[]): number =>
  counts.reduce((sum, entry) => sum + entry.count, 0);

/**
 * A clean y-axis top and step: 1, 2 or 5 times a power of ten, so ticks land
 * on round numbers. Always at least 4 so an empty chart still has a scale.
 */
export const niceScale = (max: number, tickCount = 4): { top: number; step: number } => {
  const rough = Math.max(max, tickCount) / tickCount;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? rough;
  return { top: Math.ceil(Math.max(max, tickCount) / step) * step, step };
};

/** 0 -> "12 AM", 13 -> "1 PM". */
export const hourLabel = (hour: number): string => {
  const h = hour % 24;
  return `${h % 12 === 0 ? 12 : h % 12} ${h < 12 ? "AM" : "PM"}`;
};

/** 8 -> "8 – 9 AM", 11 -> "11 AM – 12 PM". */
export const hourSpanLabel = (hour: number): string => {
  const [start, end] = [hourLabel(hour), hourLabel(hour + 1)];
  const sameHalf = start.slice(-2) === end.slice(-2);
  return sameHalf ? `${start.slice(0, -3)} – ${end}` : `${start} – ${end}`;
};
