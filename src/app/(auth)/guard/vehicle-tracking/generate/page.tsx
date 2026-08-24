"use client";

import { useState } from "react";
import { AlertCircle, Check, Loader2, QrCode } from "lucide-react";
import { useRouter } from "next/navigation";
import { parsePlate } from "@/lib/plate";
import { PlateError } from "@/lib/types/types";
import { createParkingTicket } from "@/lib/services/db";
import { AppBar } from "@/components/AppBar";

const PLATE_PATTERN = /^[A-Z]{3}-[0-9]{4}$/;

/** Turn a Firestore failure into something a guard can act on. */
function describeWriteFailure(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";

  if (code === "permission-denied") {
    return "Firestore refused the write (permission-denied). Sign in as guard staff and try again.";
  }

  if (code === "unavailable" || code === "failed-precondition") {
    return "Cannot reach Firestore. Check the network connection and try again.";
  }

  const message = err instanceof Error ? err.message : String(err);
  return `Could not save the ticket${code ? ` (${code})` : ""}. ${message}`;
}

export default function GenerateQRCodePage() {
  const router = useRouter();
  const [plateNumber, setPlateNumber] = useState("");
  const [error, setError] = useState<PlateError | null>(null);
  const [writeError, setWriteError] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePlateChange = (value: string) => {
    const normalized = value.toUpperCase();
    const letters = (normalized.match(/[A-Z]/g) ?? []).slice(0, 3).join("");
    const numbers = (normalized.match(/[0-9]/g) ?? []).slice(0, 4).join("");
    const formatted = letters.length === 3 ? `${letters}-${numbers}` : letters;

    setPlateNumber(formatted);
    if (error) setError(null);
    if (writeError) setWriteError("");
  };

  const handlePlateKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && plateNumber.endsWith("-")) {
      event.preventDefault();
      setPlateNumber(plateNumber.slice(0, -1));
    }
  };

  const handleGenerate = async () => {
    const result = parsePlate(plateNumber);

    if (result.ok) {
      setError(null);
      setWriteError("");
      setIsGenerating(true);

      try {
        // 1. Generate the unique Ticket ID here
        const newTicketId = `GUEST-${String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0")}`;

        // 2. Save it to Firestore
        await createParkingTicket(newTicketId, result.value);

        // 3. Route to result page with BOTH plate and ticket ID in the URL
        const params = new URLSearchParams({
          plate: result.value,
          ticketId: newTicketId,
        });

        router.push(`/guard/vehicle-tracking/generate/result?${params.toString()}`);
      } catch (err) {
        console.error("Failed to generate ticket:", err);
        setWriteError(describeWriteFailure(err));
      } finally {
        setIsGenerating(false);
      }
    } else {
      setError(result.error);
    }
  };

  const isComplete = PLATE_PATTERN.test(plateNumber);

  return (
    <div className="bg-sand-50 flex min-h-screen w-full flex-col">
      <AppBar
        title="Generate QR code"
        subtitle="New vehicle ticket"
        backHref="/guard/vehicle-tracking"
      />

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-8">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleGenerate();
          }}
          className="pc-card p-6"
        >
          <div className="bg-brand-50 text-brand-600 mb-5 flex h-12 w-12 items-center justify-center rounded-2xl">
            <QrCode size={24} strokeWidth={1.9} />
          </div>

          <h1 className="text-ink-900 text-xl font-extrabold tracking-tight">Vehicle plate number</h1>
          <p className="text-ink-500 mt-1 text-sm">
            Type the plate exactly as it appears. The dash is added for you.
          </p>

          {/* Plate-styled input: the guard is copying what they see on the bumper */}
          <label htmlFor="plate" className="sr-only">
            Vehicle plate number
          </label>
          <div className="relative mt-5">
            <input
              id="plate"
              type="text"
              value={plateNumber}
              onChange={(e) => handlePlateChange(e.target.value)}
              onKeyDown={handlePlateKeyDown}
              maxLength={8}
              autoFocus
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              disabled={isGenerating}
              placeholder="ABC-1234"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? "plate-error" : "plate-hint"}
              className={`border-sand-300 bg-sand-100 text-ink-900 placeholder:text-ink-300 w-full rounded-[0.875rem] border-2 py-4 text-center font-mono text-3xl font-bold tracking-[0.18em] uppercase outline-none transition-colors disabled:opacity-60 ${
                error
                  ? "border-red-400 bg-red-50"
                  : isComplete
                    ? "border-open/60 bg-white"
                    : "focus:border-brand-400 focus:bg-white"
              }`}
            />
            {isComplete && !error && (
              <Check
                size={20}
                className="text-open absolute right-4 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
            )}
          </div>

          {error ? (
            <p
              id="plate-error"
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-[0.625rem] bg-red-50 px-3 py-2.5 text-xs font-medium text-red-700"
            >
              <AlertCircle size={15} className="mt-px shrink-0" />
              {error.message}
            </p>
          ) : (
            <p id="plate-hint" className="text-ink-400 mt-3 text-center text-xs">
              Format: three letters, four digits — e.g. ABC-1234
            </p>
          )}

          {writeError && (
            <p
              role="alert"
              className="mt-3 flex items-start gap-2 rounded-[0.625rem] bg-red-50 px-3 py-2.5 text-xs font-medium leading-relaxed text-red-700"
            >
              <AlertCircle size={15} className="mt-px shrink-0" />
              {writeError}
            </p>
          )}

          <button
            type="submit"
            disabled={isGenerating || !isComplete}
            className="pc-btn pc-btn-primary mt-5 w-full"
          >
            {isGenerating && <Loader2 size={16} className="animate-spin" />}
            {isGenerating ? "Creating ticket…" : "Generate QR code"}
          </button>
        </form>

        <p className="text-ink-400 mt-4 text-center text-xs">
          The ticket is saved to the campus log the moment it is created.
        </p>
      </main>
    </div>
  );
}
