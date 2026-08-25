"use client";

import { getPercentFull, getStatus } from "@/lib/parkingStatus";
import type { ParkingArea } from "@/lib/types/schema";
import { StatusPill } from "@/components/StatusPill";
import type { LotCardProps } from "@/lib/types/types";


export function LotCard({ id, name, occupied, capacity, active = false, onSelect }: LotCardProps) {
  const percentFull = getPercentFull(occupied, capacity);
  const status = getStatus(percentFull);
  const free = Math.max(0, capacity - occupied);

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-ink-900 truncate text-sm font-semibold">{name}</p>
          <p className="text-ink-500 mt-0.5 text-xs">
            <span className="text-ink-800 font-semibold">{free}</span> free · {occupied}/{capacity}
          </p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="bg-sand-200 mt-3 h-2 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percentFull}%`, backgroundColor: status.color }}
        />
      </div>
    </>
  );

  const shell = `pc-card w-full p-4 text-left transition-shadow ${
    active ? "ring-brand-400 ring-2 ring-offset-2 ring-offset-sand-50" : ""
  }`;

  if (!onSelect) {
    return <div className={shell}>{body}</div>;
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      aria-pressed={active}
      className={`${shell} hover:shadow-raised cursor-pointer`}
    >
      {body}
    </button>
  );
}

export function LotCardSkeleton() {
  return (
    <div className="pc-card p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="pc-skeleton h-4 w-28 rounded" />
        <div className="pc-skeleton h-5 w-20 rounded-full" />
      </div>
      <div className="pc-skeleton mt-3 h-2 rounded-full" />
    </div>
  );
}
