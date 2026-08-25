"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronDown, ChevronLeft, LogIn, LogOut, MapPin, ScanLine, X } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { processTicketScan, subscribeToParkingAreas } from "@/lib/services/db";
import type { ParkingArea } from "@/lib/types/schema";

export default function ScanQRPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");

  // New State Management to handle UI screens smoothly
  const [isProcessing, setIsProcessing] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [rejectMessage, setRejectMessage] = useState(""); // New rejection state

  const router = useRouter();

  // Dynamic Parking Areas State
  const [parkingAreas, setParkingAreas] = useState<ParkingArea[]>([]);

  // Dropdown States
  const [action, setAction] = useState<"Parked" | "Exited">("Parked");
  const [location, setLocation] = useState<string>("");

  const actionRef = useRef(action);
  const locationRef = useRef(location);

  useEffect(() => {
    actionRef.current = action;
  }, [action]);

  useEffect(() => {
    locationRef.current = location;
  }, [location]);

  // --- Fetch dynamic locations from Firebase ---
  useEffect(() => {
    const unsubscribe = subscribeToParkingAreas((liveData) => {
      setParkingAreas(liveData);
      setLocation((current) => {
        if (!current && liveData.length > 0) {
          return liveData[0].id;
        }
        return current;
      });
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let disposed = false;
    let resultHandled = false;
    let scanner: Html5Qrcode | null = null;
    let stopping: Promise<void> | null = null;

    const stopScanner = () => {
      if (stopping) return stopping;
      if (!scanner) return Promise.resolve();

      const state = scanner.getState();
      if (
        state !== Html5QrcodeScannerState.SCANNING &&
        state !== Html5QrcodeScannerState.PAUSED
      ) {
        return Promise.resolve();
      }

      stopping = scanner.stop().finally(() => {
        stopping = null;
      });
      return stopping;
    };

    async function handleScanResult(decodedText: string) {
      setIsProcessing(true);
      setError("");
      setRejectMessage("");

      try {
        const { plateNumber, newStatus } = await processTicketScan(
          decodedText,
          locationRef.current,
          actionRef.current
        );

        setIsProcessing(false);
        setSuccessMessage(`Vehicle ${plateNumber} is now ${newStatus}!`);

        setTimeout(() => {
          router.push("/guard/vehicle-tracking");
        }, 2000);
      } catch (err) {
        // If the database blocks the scan (e.g. capacity full), show the rejection screen
        setIsProcessing(false);
        setRejectMessage(err instanceof Error ? err.message : "Failed to process QR code");
      }
    }

    const startFrame = requestAnimationFrame(() => {
      if (disposed) return;

      scanner = new Html5Qrcode("qr-reader");
      scannerRef.current = scanner;

      scanner
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (decodedText) => {
            if (resultHandled || disposed) return;

            resultHandled = true;
            stopScanner()
              .then(() => handleScanResult(decodedText))
              .catch(() => setError("Unable to stop the camera scanner"));
          },
          () => {}
        )
        .then(() => {
          if (disposed) return stopScanner();
        })
        .catch((err) => {
          if (!disposed) setError("Camera access failed: " + err);
        });
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(startFrame);
      stopScanner().catch(() => {});
      if (scannerRef.current === scanner) scannerRef.current = null;
    };
  }, [router]);

  const isScanning = !isProcessing && !successMessage && !rejectMessage;
  const isExit = action === "Exited";

  return (
    <div className="bg-ink-900 flex min-h-screen w-full flex-col text-white">
      <header className="bg-brand-400 text-ink-900 sticky top-0 z-20">
        <div className="mx-auto flex w-full max-w-md items-center gap-2 px-4 py-3">
          <Link
            href="/guard/vehicle-tracking"
            className="-ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-black/10"
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </Link>
          <span className="min-w-0">
            <span className="block text-base font-bold leading-tight">Scan QR code</span>
            <span className="text-ink-900/65 block text-xs">
              {isExit ? "Logging vehicles out" : "Logging vehicles in"}
            </span>
          </span>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-4 pb-8 pt-5">
        {isScanning && (
          <>
            {/* Direction of the scan — the single most consequential choice here */}
            <div>
              <p className="text-brand-300 text-[11px] font-bold uppercase tracking-[0.12em]">
                Scanner action
              </p>
              <div
                role="radiogroup"
                aria-label="Scanner action"
                className="mt-2 grid grid-cols-2 gap-1.5 rounded-[0.875rem] bg-white/10 p-1.5"
              >
                <ActionToggle
                  active={!isExit}
                  onClick={() => setAction("Parked")}
                  icon={<LogIn size={16} />}
                  label="Park in"
                />
                <ActionToggle
                  active={isExit}
                  onClick={() => setAction("Exited")}
                  icon={<LogOut size={16} />}
                  label="Exit out"
                />
              </div>
            </div>

            <div className={`mt-5 transition-opacity ${isExit ? "opacity-40" : ""}`}>
              <p className="text-brand-300 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em]">
                <MapPin size={13} />
                Parking area
              </p>
              {/* A select, not chips — the building list grows over time */}
              <div className="relative mt-2">
                <label className="sr-only" htmlFor="scan-location">
                  Parking area
                </label>
                <select
                  id="scan-location"
                  value={location}
                  disabled={isExit || parkingAreas.length === 0}
                  onChange={(e) => setLocation(e.target.value)}
                  className="border-brand-400 focus:ring-brand-400 w-full appearance-none rounded-[0.75rem] border-2 bg-[#1A1A1A] py-3 pl-3.5 pr-10 text-[15px] font-semibold text-white outline-none focus:ring-2 disabled:cursor-not-allowed"
                >
                  {parkingAreas.length === 0 ? (
                    <option value="">Loading locations…</option>
                  ) : (
                    parkingAreas.map((area) => (
                      <option key={area.id} value={area.id}>
                        {area.name}
                      </option>
                    ))
                  )}
                </select>
                <ChevronDown
                  size={18}
                  className="text-brand-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2"
                />
              </div>
              {isExit && (
                <p className="mt-2 text-xs text-white/45">
                  Exits are matched to the lot the vehicle parked in.
                </p>
              )}
            </div>

            {/* Camera viewport */}
            <div className="relative mx-auto mt-6 aspect-square w-full max-w-[300px]">
              <div
                id="qr-reader"
                className="h-full w-full overflow-hidden rounded-[1.25rem] bg-black"
              />

              {/* Framing overlay drawn on top of the video feed */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.25rem]">
                {["left-3 top-3 border-l-2 border-t-2 rounded-tl-lg",
                  "right-3 top-3 border-r-2 border-t-2 rounded-tr-lg",
                  "left-3 bottom-3 border-l-2 border-b-2 rounded-bl-lg",
                  "right-3 bottom-3 border-r-2 border-b-2 rounded-br-lg",
                ].map((corner) => (
                  <span key={corner} className={`border-brand-400 absolute h-9 w-9 ${corner}`} />
                ))}
                <span className="via-brand-400 pc-scanline absolute inset-x-8 top-1/2 h-0.5 bg-gradient-to-r from-transparent to-transparent" />
              </div>
            </div>

            {error ? (
              <p role="alert" className="mt-4 text-center text-sm font-semibold text-red-400">
                {error}
              </p>
            ) : (
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-sm text-white/55">
                <ScanLine size={15} />
                Align the QR code inside the frame
              </p>
            )}
          </>
        )}

        {isProcessing && (
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="border-brand-400 h-12 w-12 animate-spin rounded-full border-4 border-t-transparent" />
            <p className="mt-4 font-semibold text-white/90">Processing ticket…</p>
          </div>
        )}

        {successMessage && (
          <ResultScreen
            tone="success"
            title="Logged"
            message={successMessage}
            footer={<p className="text-sm text-white/45">Returning to vehicle tracking…</p>}
          />
        )}

        {rejectMessage && (
          <ResultScreen
            tone="error"
            title="Action denied"
            message={rejectMessage}
            footer={
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="pc-btn pc-btn-primary"
              >
                Try again
              </button>
            }
          />
        )}
      </main>
    </div>
  );
}

function ActionToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-[0.625rem] py-2.5 text-sm font-bold transition-colors ${
        active ? "bg-brand-400 text-ink-900 shadow-sm" : "text-white/65 hover:text-white"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}

function ResultScreen({
  tone,
  title,
  message,
  footer,
}: {
  tone: "success" | "error";
  title: string;
  message: string;
  footer: React.ReactNode;
}) {
  const success = tone === "success";

  return (
    <div className="pc-rise flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center rounded-full ${
          success ? "bg-open shadow-[0_0_28px_rgba(46,158,79,0.45)]" : "bg-full shadow-[0_0_28px_rgba(211,58,44,0.45)]"
        }`}
      >
        {success ? (
          <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          <X className="h-8 w-8 text-white" strokeWidth={3} />
        )}
      </div>

      <div>
        <p
          className={`text-2xl font-extrabold tracking-tight ${success ? "text-open" : "text-full"}`}
        >
          {title}
        </p>
        <p className="mt-1.5 text-base font-medium text-white/90">{message}</p>
      </div>

      <div className="mt-2">{footer}</div>
    </div>
  );
}
