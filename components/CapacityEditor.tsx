"use client";

import { useState } from "react";
import { Check, Pencil } from "lucide-react";
import { MAX_CAPACITY, parseCapacity } from "@/lib/capacity";
import { freeSpaces, getPercentFull, getStatus } from "@/lib/parkingStatus";
import { updateParkingCapacity } from "@/lib/services/db";
import type { ParkingArea } from "@/lib/types/schema";
import { StatusPill } from "@/components/StatusPill";

type CapacityEditorProps = {
  areas: readonly ParkingArea[];
};

/**
 * Per-lot list in the admin sidebar: one compact row per lot inside a single
 * card, so many lots still fit beside the log. "Edit limits" swaps the rows
 * for capacity inputs that save one lot at a time.
 */
export function CapacityEditor({ areas }: CapacityEditorProps) {
  const [editing, setEditing] = useState(false);

  return (
    <section className="pc-card overflow-hidden" aria-labelledby="lot-capacity-title">
      <div className="border-sand-200 flex items-center justify-between gap-2 border-b px-4 py-2.5">
        <div>
          <h2 id="lot-capacity-title" className="text-ink-900 text-sm font-bold">
            Parking lots
          </h2>
          <p className="text-ink-400 text-xs">
            {editing ? "Max vehicles each lot accepts" : `${areas.length} lots`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((on) => !on)}
          aria-pressed={editing}
          className="text-ink-500 hover:bg-sand-100 hover:text-ink-900 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors"
        >
          {editing ? <Check size={13} /> : <Pencil size={13} />}
          {editing ? "Done" : "Edit limits"}
        </button>
      </div>

      <ul className="divide-sand-100 divide-y">
        {areas.map((area) =>
          editing ? <CapacityRow key={area.id} area={area} /> : <LotRow key={area.id} area={area} />
        )}
      </ul>
    </section>
  );
}

// Read-only row: the LotCard content at list density.
function LotRow({ area }: { area: ParkingArea }) {
  const percentFull = getPercentFull(area.occupied, area.capacity);
  const status = getStatus(percentFull);

  return (
    <li className="px-4 py-2">
      <div className="flex items-center gap-2">
        <p className="text-ink-900 min-w-0 flex-1 truncate text-[13px] font-semibold">{area.name}</p>
        <p className="text-ink-500 shrink-0 text-[11px] tabular-nums" title={`${freeSpaces(area)} free`}>
          {area.occupied}/{area.capacity}
        </p>
        <StatusPill status={status} className="shrink-0" />
      </div>
      <div className="bg-sand-200 mt-1.5 h-1 overflow-hidden rounded-full">
        <div
          className="h-full rounded-full transition-[width] duration-700 ease-out"
          style={{ width: `${percentFull}%`, backgroundColor: status.color }}
        />
      </div>
    </li>
  );
}

function CapacityRow({ area }: { area: ParkingArea }) {
  const [draft, setDraft] = useState(String(area.capacity));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState("");

  const parsed = parseCapacity(area.occupied)(draft);
  const changed = !parsed.ok || parsed.value !== area.capacity;
  const message = saveError || (!parsed.ok && changed ? parsed.error.message : "");
  const inputId = `capacity-${area.id}`;

  async function handleSave(event: React.FormEvent) {
    event.preventDefault();
    if (!parsed.ok || !changed) return;

    setSaving(true);
    setSaveError("");
    const result = await updateParkingCapacity(area.id, parsed.value);
    setSaving(false);

    if (result.ok) {
      setDraft(String(result.value));
      setSaved(true);
    } else {
      setSaveError(result.error.message);
    }
  }

  return (
    <li className="px-4 py-2.5">
      <form onSubmit={handleSave} className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <label htmlFor={inputId} className="text-ink-900 block truncate text-sm font-semibold">
            {area.name}
          </label>
          <p className="text-ink-400 mt-0.5 text-xs">
            {area.occupied} parked now
          </p>
        </div>

        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={Math.max(1, area.occupied)}
          max={MAX_CAPACITY}
          step={1}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setSaved(false);
            setSaveError("");
          }}
          aria-invalid={Boolean(message)}
          aria-describedby={message ? `${inputId}-error` : undefined}
          className={`pc-field w-16 px-2 py-1.5 text-right text-sm font-semibold tabular-nums ${
            message ? "border-full!" : ""
          }`}
        />

        <button
          type="submit"
          disabled={!parsed.ok || !changed || saving}
          className="pc-btn pc-btn-dark w-14 px-0 py-2 text-xs"
        >
          {saving ? "…" : saved && !changed ? <Check size={14} aria-label="Saved" /> : "Save"}
        </button>
      </form>

      {message && (
        <p id={`${inputId}-error`} role="alert" className="text-full mt-1.5 text-xs">
          {message}
        </p>
      )}
    </li>
  );
}
