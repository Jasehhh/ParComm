"use client";

import { Suspense, useCallback, useSyncExternalStore } from "react";
import { CheckCircle2, Printer, RotateCcw } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { AppBar } from "@/components/AppBar";
import { Wordmark, Tagline } from "@/components/Wordmark";

const VALID_FOR_HOURS = 10;

/**
 * Thermal-receipt print layout: 80mm roll, single column, QR blown up to fill
 * the paper width. Everything forced to pure black so it survives a monochrome
 * ticket printer.
 */
const TICKET_PRINT_CSS = `
@media print {
  @page { size: 80mm auto; margin: 4mm; }

  html, body { background: #fff !important; margin: 0 !important; padding: 0 !important; }

  /* Strip the app chrome: the roll holds the stub and nothing else */
  .pc-ticket-page { min-height: 0 !important; display: block !important; }
  .pc-ticket-main {
    max-width: none !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    display: block !important;
  }

  /*
    Pinned to a fixed receipt width rather than 100%. Browsers routinely ignore
    @page size and print onto the selected paper (A4/Letter), which stretched
    the stub across the sheet — this keeps it a narrow slip on any paper.
  */
  .pc-ticket {
    width: min(140mm, 100%) !important;
    max-width: min(140mm, 100%) !important;
    margin: 0 auto !important;
    border: 0 !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    background: #fff !important;
    animation: none !important;
    overflow: visible !important;
  }

  /* Monochrome: brand amber prints as pale grey on thermal paper */
  .pc-ticket, .pc-ticket * { color: #000 !important; }

  .pc-ticket-head { padding: 0 0 2mm !important; }

  .pc-ticket-logo {
    width: min(30mm, 22%) !important;
    height: auto !important;
    margin: 0 auto 4mm !important;
    display: block !important;
  }

  /* Wordmark carries its own size class on an inner span — reach it too */
  .pc-ticket-brand, .pc-ticket-brand * { font-size: 34pt !important; line-height: 1 !important; }
  .pc-ticket-tagline { font-size: 11pt !important; margin-top: 1mm !important; }

  /* The QR is the point of the slip — fill the printable width */
  .pc-ticket-qr {
    margin: 8mm auto 0 !important;
    padding: 0 !important;
    border: 0 !important;
    border-radius: 0 !important;
    width: min(108mm, 92%) !important;
  }
  .pc-ticket-qr svg {
    width: 100% !important;
    height: auto !important;
    display: block;
    shape-rendering: crispEdges;
  }

  .pc-ticket-id {
    font-size: 26pt !important;
    margin-top: 6mm !important;
    letter-spacing: 0.06em !important;
  }

  .pc-ticket-tear { height: 6mm !important; margin: 4mm 0 !important; }

  .pc-ticket-meta {
    display: block !important;
    padding: 0 !important;
    text-align: center !important;
  }
  .pc-ticket-meta > div { padding: 0 !important; margin-top: 5mm !important; }
  .pc-ticket-plate { font-size: 32pt !important; letter-spacing: 0.08em !important; }
  .pc-ticket-valid { font-size: 13pt !important; }

  .pc-ticket .pc-eyebrow { font-size: 10pt !important; }

  .pc-ticket-footer {
    display: block !important;
    margin-top: 8mm !important;
    padding-top: 3mm !important;
    border-top: 1px dashed #000 !important;
    text-align: center !important;
    font-size: 10pt !important;
  }
}
`;

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
      {/*
        Receipt print styles. Kept on this route (not globals.css) so the
        80mm @page size applies only while the ticket is on screen — printing
        the admin log elsewhere still uses the browser default paper.
      */}
      <style>{TICKET_PRINT_CSS}</style>

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
