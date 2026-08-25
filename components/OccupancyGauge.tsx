"use client";

import { getPercentFull, getStatus } from "@/lib/parkingStatus";

type OccupancyGaugeProps = {
  occupied: number;
  capacity: number;
  /** Diameter in pixels of the rendered gauge. */
  size?: number;
  label?: string;
};

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
/** Gauge sweeps 270°, leaving an open gap at the bottom. */
const ARC = CIRCUMFERENCE * 0.75;

export function OccupancyGauge({ occupied, capacity, size = 176, label }: OccupancyGaugeProps) {
  const percentFull = getPercentFull(occupied, capacity);
  const status = getStatus(percentFull);
  const filled = (percentFull / 100) * ARC;

  return (
    <div
      className="relative mx-auto aspect-square"
      style={{ width: size, maxWidth: "100%" }}
      role="img"
      aria-label={`${occupied} of ${capacity} spaces taken, ${percentFull} percent full — ${status.label}`}
    >
      <svg viewBox="0 0 120 120" className="h-full w-full">
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke="var(--color-sand-200)"
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${ARC} ${CIRCUMFERENCE}`}
          transform="rotate(135 60 60)"
        />
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          stroke={status.color}
          strokeWidth="11"
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          transform="rotate(135 60 60)"
          className="transition-[stroke-dasharray,stroke] duration-700 ease-out"
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5 pb-2">
        <output className="text-ink-900 text-4xl font-extrabold leading-none tracking-tight">
          {occupied}
        </output>
        <span className="text-ink-400 text-xs font-medium">of {capacity} taken</span>
        <span
          className="mt-1.5 text-[11px] font-bold uppercase tracking-wider"
          style={{ color: status.color }}
        >
          {label ?? `${percentFull}% full`}
        </span>
      </div>
    </div>
  );
}
