"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function ScanQRPage() {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();

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

    function handleScanResult(decodedText: string) {
      let plateNumber = decodedText.trim();

      // 1. Try JSON parsing (if payload is {"plate": "ABC-1234"})
      try {
        const parsed = JSON.parse(decodedText);
        if (parsed && typeof parsed.plate === "string") {
          plateNumber = parsed.plate;
        }
      } catch {
        // Fallback: If not JSON, process string directly
      }

      // 2. Extract plate format if wrapped in text like "[ QR: ABC-1234 ]"
      const extractedMatch = plateNumber.match(/([A-Z]{3}-\d{3,4})/i);
      if (extractedMatch) {
        plateNumber = extractedMatch[1].toUpperCase();
      }

      // 3. Final sanity check before navigation
      if (plateNumber.length > 0) {
        router.push(`/guard/vehicle-tracking?scanned=${encodeURIComponent(plateNumber)}`);
      } else {
        setError("Invalid or unreadable QR content.");
      }
    }

    // Delaying startup by one frame lets React Strict Mode cancel its test mount
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

  return (
    <div
      className={`${inter.variable} min-h-screen w-full flex flex-col`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
      <div className="p-4" style={{ backgroundColor: "#F5A623" }}>
        <div className="flex items-center gap-2 text-black font-bold">
          <Link href="/guard/vehicle-tracking" className="flex cursor-pointer items-center" aria-label="Go back">
            <ChevronLeft size={22} />
          </Link>
          <span className="text-lg">Scan QR Code</span>
        </div>
      </div>

      <div className="bg-black flex-1 flex flex-col items-center justify-center gap-5 p-6">
        <div
          id="qr-reader"
          className="w-full max-w-70 aspect-square rounded-xl overflow-hidden"
          style={{ border: "2px solid #F5A623" }}
        />
        {error && <p className="text-red-400 text-sm text-center font-medium">{error}</p>}
        <p className="text-white/70 text-sm mb-4">Align the QR code inside frame.</p>
      </div>
    </div>
  );
}