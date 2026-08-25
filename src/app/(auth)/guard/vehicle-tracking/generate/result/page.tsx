"use client";

import { Suspense, useCallback, useSyncExternalStore } from "react";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { AppBar } from "@/components/AppBar";
import { Wordmark, Tagline } from "@/components/Wordmark";

const VALID_FOR_HOURS = 12;

const formatValidUntil = (date: Date): string =>
  date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }) +
  " • " +
  date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

/**
 * The expiry depends on the wall clock, so it can only be read on the client.
 * Cached per ticket so the label stays fixed once the stub has rendered.
 */
const expiryByTicket = new Map<string, string>();
const subscribeToNothing = () => () => {};
const noExpiryOnServer = () => "";

function useValidUntil(ticketId: string): string {
  const readExpiry = useCallback(() => {
    const cached = expiryByTicket.get(ticketId);
    if (cached) return cached;

    const value = formatValidUntil(new Date(Date.now() + VALID_FOR_HOURS * 60 * 60 * 1000));
    expiryByTicket.set(ticketId, value);
    return value;
  }, [ticketId]);

  return useSyncExternalStore(subscribeToNothing, readExpiry, noExpiryOnServer);
}

function ResultContent() {
  const searchParams = useSearchParams();

  const ticketId = searchParams.get("ticketId") ?? "ERROR";
  const plate = searchParams.get("plate") ?? "—";
  const validUntil = useValidUntil(ticketId);

  return (
    <div className="pc-ticket-page bg-sand-50 flex min-h-screen w-full flex-col print:bg-white">
      <div className="print:hidden">
        <AppBar
          title="Ticket ready"
          subtitle="Print and hand to the driver"
          backHref="/guard/vehicle-tracking/generate"
        />
      </div>

      <main className="pc-ticket-main mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-6">
        <p className="text-open mb-4 flex items-center justify-center gap-2 text-sm font-semibold print:hidden">
          <CheckCircle2 size={17} />
          Ticket created and logged
        </p>

        {/* The ticket stub — this is the only thing that prints */}
        <section className="pc-ticket pc-card pc-rise relative overflow-hidden">
          <div className="pc-ticket-head flex flex-col items-center px-6 pb-6 pt-7 text-center">
            <Image
              src="/parcomm-logo.png"
              alt=""
              width={64}
              height={64}
              className="pc-ticket-logo mb-3 h-14 w-14 object-contain"
              priority
            />
            <Wordmark size="lg" className="pc-ticket-brand" />
            <Tagline className="pc-ticket-tagline mt-1" />

            <div className="pc-ticket-qr border-sand-200 mt-6 rounded-2xl border bg-white p-4">
              <QRCodeSVG value={ticketId} size={168} level="H" marginSize={2} />
            </div>

            <p className="pc-ticket-id text-ink-900 mt-5 font-mono text-lg font-bold tracking-wide">
              {ticketId}
            </p>
            <p className="pc-eyebrow mt-0.5">Ticket ID</p>
          </div>

          {/* Perforated tear line */}
          <div className="pc-ticket-tear relative h-6">
            <span className="bg-sand-50 absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full print:hidden" />
            <span className="bg-sand-50 absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full print:hidden" />
            <span className="border-sand-300 absolute inset-x-5 top-1/2 border-t border-dashed" />
          </div>

          <dl className="pc-ticket-meta grid grid-cols-2 gap-px px-6 pb-6 pt-1 text-left">
            <div className="pr-3">
              <dt className="pc-eyebrow">Plate</dt>
              <dd className="pc-ticket-plate text-ink-900 mt-1 font-mono text-base font-bold uppercase">
                {plate}
              </dd>
            </div>
            <div className="pl-3">
              <dt className="pc-eyebrow">Valid until</dt>
              <dd className="pc-ticket-valid text-ink-800 mt-1 text-sm font-medium">
                {validUntil || "—"}
              </dd>
            </div>
          </dl>

          {/* Print-only footer: the driver keeps this slip */}
          <p className="pc-ticket-footer hidden">Present this ticket when exiting campus.</p>
        </section>

        <div className="mt-5 flex flex-col gap-2.5 print:hidden">
          <button type="button" onClick={() => window.print()} className="pc-btn pc-btn-dark w-full">
            <Printer size={17} />
            Print ticket
          </button>
          <Link href="/guard/vehicle-tracking/generate" className="pc-btn pc-btn-ghost w-full">
            <RotateCcw size={16} />
            Generate another
          </Link>
        </div>
      </main>
    </div>
  );
}

export default function GenerateQRCodeResultPage() {
  return (
    <Suspense
      fallback={
        <div className="bg-sand-50 flex min-h-screen w-full items-center justify-center">
          <div className="pc-card w-full max-w-md p-6">
            <div className="pc-skeleton mx-auto h-6 w-32 rounded" />
            <div className="pc-skeleton mx-auto mt-6 h-[200px] w-[200px] rounded-2xl" />
            <div className="pc-skeleton mx-auto mt-6 h-4 w-40 rounded" />
          </div>
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
