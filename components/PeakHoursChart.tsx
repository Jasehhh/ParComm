"use client";

import { useEffect, useMemo, useState } from "react";
import {
  hourLabel,
  hourSpanLabel,
  hourlyTraffic,
  niceScale,
  peakOf,
  totalOf,
  type TrafficMetric,
  type TrafficRange,
} from "@/lib/peakHours";
import type { ActivityLogRecord } from "@/lib/types/schema";

type PeakHoursChartProps = {
  rows: readonly ActivityLogRecord[];
};

const METRICS: { value: TrafficMetric; label: string }[] = [
  { value: "arrivals", label: "Arrivals" },
  { value: "departures", label: "Departures" },
];

const RANGES: { value: TrafficRange; label: string; phrase: string }[] = [
  { value: "today", label: "Today", phrase: "today" },
  { value: "7d", label: "7 days", phrase: "in the last 7 days" },
  { value: "30d", label: "30 days", phrase: "in the last 30 days" },
];

const NOUN: Record<TrafficMetric, [string, string]> = {
  arrivals: ["arrival", "arrivals"],
  departures: ["departure", "departures"],
};

const countText = (count: number, metric: TrafficMetric) =>
  `${count} ${NOUN[metric][count === 1 ? 0 : 1]}`;

// Axis labels every 3 hours keep 24 columns readable at phone width.
const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21];

const BAR = "var(--color-brand-400)";
const BAR_PEAK = "var(--color-brand-600)";

export function PeakHoursChart({ rows }: PeakHoursChartProps) {
  const [metric, setMetric] = useState<TrafficMetric>("arrivals");
  const [range, setRange] = useState<TrafficRange>("today");
  const [activeHour, setActiveHour] = useState<number | null>(null);

  // The range is anchored to "now"; refresh it each minute so "Today" rolls
  // over at midnight without a reload.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(id);
  }, []);

  const counts = useMemo(() => hourlyTraffic(rows, metric, range, now), [rows, metric, range, now]);
  const peak = peakOf(counts);
  const total = totalOf(counts);
  const { top, step } = niceScale(peak?.count ?? 0);
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);
  const rangePhrase = RANGES.find((r) => r.value === range)?.phrase ?? "";
  const active = activeHour === null ? null : counts[activeHour];

  return (
    <section className="pc-card mb-5 p-4 sm:p-5" aria-labelledby="peak-hours-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="peak-hours-title" className="text-ink-900 text-sm font-bold">
            Peak parking hours
          </h2>
          <p className="text-ink-400 text-xs">
            {metric === "arrivals" ? "Vehicles parking in" : "Vehicles leaving"}, by hour of day
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Segmented label="Traffic direction" options={METRICS} value={metric} onChange={setMetric} />
          <Segmented label="Time range" options={RANGES} value={range} onChange={setRange} />
        </div>
      </div>

      <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-3">
        <div>
          <dt className="text-ink-500 flex items-center gap-1.5 text-xs font-medium">
            <span className="h-2 w-2 rounded-[2px]" style={{ background: BAR_PEAK }} aria-hidden="true" />
            Busiest hour
          </dt>
          <dd className="text-ink-900 mt-1 text-xl font-bold leading-none tracking-tight">
            {peak ? hourSpanLabel(peak.hour) : "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-500 text-xs font-medium">At peak</dt>
          <dd className="text-ink-900 mt-1 text-xl font-bold leading-none tracking-tight">
            {peak ? peak.count : 0}
            <span className="text-ink-400 ml-1 text-xs font-semibold">{NOUN[metric][1]}</span>
          </dd>
        </div>
        <div>
          <dt className="text-ink-500 text-xs font-medium">Total</dt>
          <dd className="text-ink-900 mt-1 text-xl font-bold leading-none tracking-tight">
            {total}
            <span className="text-ink-400 ml-1 text-xs font-semibold">{rangePhrase}</span>
          </dd>
        </div>
      </dl>

      <div className="mt-5 grid grid-cols-[1.75rem_minmax(0,1fr)] gap-x-2">
        {/* Y-axis ticks */}
        <div className="relative h-44" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="text-ink-400 absolute right-0 translate-y-1/2 font-mono text-[10px] leading-none tabular-nums"
              style={{ bottom: `${(tick / top) * 100}%` }}
            >
              {tick}
            </span>
          ))}
        </div>

        {/* Plot */}
        <div className="relative h-44" onMouseLeave={() => setActiveHour(null)}>
          {ticks.map((tick) => (
            <span
              key={tick}
              className={`absolute inset-x-0 h-px ${tick === 0 ? "bg-sand-300" : "bg-sand-200"}`}
              style={{ bottom: `${(tick / top) * 100}%` }}
              aria-hidden="true"
            />
          ))}

          <div className="absolute inset-0 flex items-end">
            {counts.map(({ hour, count }) => {
              const isPeak = peak?.hour === hour;
              const isActive = activeHour === hour;
              const height = barHeight(count, top);

              return (
                <button
                  key={hour}
                  type="button"
                  className="relative flex h-full flex-1 cursor-default items-end justify-center px-px outline-none"
                  aria-label={`${hourSpanLabel(hour)}: ${countText(count, metric)}`}
                  onMouseEnter={() => setActiveHour(hour)}
                  onFocus={() => setActiveHour(hour)}
                  onBlur={() => setActiveHour(null)}
                >
                  {isActive && (
                    <span className="bg-sand-100 absolute inset-x-px inset-y-0 rounded-[4px]" aria-hidden="true" />
                  )}
                  <span
                    className="relative w-full max-w-6 rounded-t-[4px] transition-[height,filter] duration-500 ease-out"
                    style={{
                      height: `${height}%`,
                      background: isPeak ? BAR_PEAK : BAR,
                      filter: isActive ? "brightness(1.08)" : undefined,
                    }}
                    aria-hidden="true"
                  />
                  {isPeak && count > 0 && (
                    <span
                      className="text-ink-700 absolute left-1/2 -translate-x-1/2 text-[11px] font-bold leading-none tabular-nums"
                      style={{ bottom: `calc(${height}% + 4px)` }}
                      aria-hidden="true"
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {total === 0 && (
            <p className="text-ink-400 absolute inset-x-0 top-1/3 text-center text-xs">
              No {NOUN[metric][1]} logged {rangePhrase}.
            </p>
          )}

          {active && (
            <div
              role="status"
              className="bg-ink-900 pointer-events-none absolute z-10 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-white shadow-lg"
              style={{
                ...tooltipPosition(active.hour),
                bottom: `calc(${barHeight(active.count, top)}% + 8px)`,
              }}
            >
              <p className="text-sm font-bold leading-tight">{countText(active.count, metric)}</p>
              <p className="text-[11px] leading-tight text-white/65">{hourSpanLabel(active.hour)}</p>
            </div>
          )}
        </div>

        {/* X-axis */}
        <div aria-hidden="true" />
        <div className="relative mt-1.5 h-3" aria-hidden="true">
          {AXIS_HOURS.map((hour) => (
            <span
              key={hour}
              className="text-ink-400 absolute -translate-x-1/2 whitespace-nowrap text-[10px] leading-none"
              style={{ left: `${((hour + 0.5) / 24) * 100}%` }}
            >
              {hourLabel(hour)}
            </span>
          ))}
        </div>
      </div>

      <details className="group mt-4">
        <summary className="text-ink-500 hover:text-ink-900 cursor-pointer text-xs font-semibold transition-colors">
          View as table
        </summary>
        {total === 0 ? (
          <p className="text-ink-400 mt-2 text-xs">Nothing to show for this range.</p>
        ) : (
          <table className="mt-2 w-full max-w-sm text-sm">
            <thead>
              <tr className="border-sand-200 text-ink-500 border-b text-left text-xs">
                <th className="py-1.5 font-semibold">Hour</th>
                <th className="py-1.5 text-right font-semibold">{METRICS.find((m) => m.value === metric)?.label}</th>
              </tr>
            </thead>
            <tbody>
              {counts
                .filter((entry) => entry.count > 0)
                .map(({ hour, count }) => (
                  <tr key={hour} className="border-sand-100 border-b last:border-b-0">
                    <td className="text-ink-700 py-1.5">
                      {hourSpanLabel(hour)}
                      {peak?.hour === hour && (
                        <span className="text-brand-700 ml-2 text-[11px] font-bold">Peak</span>
                      )}
                    </td>
                    <td className="text-ink-900 py-1.5 text-right font-semibold">{count}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </details>
    </section>
  );
}

// Bar height as a percentage of the plot; a non-zero count always shows a sliver.
const barHeight = (count: number, top: number): number =>
  count === 0 ? 0 : Math.max((count / top) * 100, 1.5);

// Centre the tooltip on its column, but pin it inside the plot at either edge.
function tooltipPosition(hour: number): React.CSSProperties {
  const centre = ((hour + 0.5) / 24) * 100;
  if (hour < 3) return { left: 0 };
  if (hour > 20) return { right: 0 };
  return { left: `${centre}%`, transform: "translateX(-50%)" };
}

function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <div role="group" aria-label={label} className="bg-sand-100 flex rounded-full p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          aria-pressed={value === option.value}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
            value === option.value ? "bg-ink-900 text-white" : "text-ink-500 hover:text-ink-900"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
