"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";
import { getPercentFull, getStatus } from "@/lib/parkingStatus";
import type { ParkingArea } from "@/lib/types/schema";

type LotPickerProps = {
  areas: ParkingArea[];
  selectedId: string;
  onSelect: (id: string) => void;
};

/** Accessible dropdown for choosing which lot the gauge is showing. */
export function LotPicker({ areas, selectedId, onSelect }: LotPickerProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selected = areas.find((area) => area.id === selectedId);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="pc-card hover:shadow-raised flex w-full cursor-pointer items-center gap-3 p-3 text-left transition-shadow"
      >
        <span className="bg-brand-50 text-brand-600 flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
          <MapPin size={17} strokeWidth={2.2} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="pc-eyebrow block">Viewing lot</span>
          <span className="text-ink-900 block truncate text-sm font-semibold">
            {selected?.name ?? "Select a lot"}
          </span>
        </span>
        <ChevronDown
          size={18}
          className={`text-ink-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Parking lots"
          className="pc-card shadow-raised pc-rise absolute left-0 top-[calc(100%+0.5rem)] z-30 max-h-72 w-full overflow-y-auto p-1.5"
        >
          {areas.map((area) => {
            const status = getStatus(getPercentFull(area.occupied, area.capacity));
            const isSelected = area.id === selectedId;

            return (
              <button
                key={area.id}
                type="button"
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onSelect(area.id);
                  setOpen(false);
                }}
                className={`flex w-full cursor-pointer items-center gap-2.5 rounded-[0.625rem] px-3 py-2.5 text-left transition-colors ${
                  isSelected ? "bg-brand-50" : "hover:bg-sand-100"
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: status.color }}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="text-ink-900 block truncate text-sm font-medium">{area.name}</span>
                  <span className="text-ink-400 block text-[11px]">
                    {Math.max(0, area.capacity - area.occupied)} free of {area.capacity}
                  </span>
                </span>
                {isSelected && <Check size={16} className="text-brand-600 shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
