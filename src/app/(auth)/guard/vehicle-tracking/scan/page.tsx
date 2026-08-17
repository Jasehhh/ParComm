"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";

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
      try {
        const data = JSON.parse(decodedText);
        router.push(`/auth/guard/vehicle-tracking?scanned=${data.plate}`);
      } catch {
        setError("Invalid QR code");
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

  return (
    <div className="min-h-screen w-full flex flex-col font-sans">
      <div className="bg-[#F5A623] p-4">
        <div className="flex items-center gap-2 font-bold text-black">
          <Link href="/guard/vehicle-tracking" className="flex cursor-pointer items-center" aria-label="Go back">
            <ChevronLeft size={22} />
          </Link>
          <span className="text-lg">Scan QR Code</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-5 bg-black p-6">
        <div id="qr-reader" className="aspect-square w-full max-w-[280px] overflow-hidden rounded-[12px] border-2 border-[#F5A623]" />
        {error && <p className="text-sm text-red-400">{error}</p>}
        <p className="mb-4 text-sm text-white/70">Align the QR code inside frame.</p>
      </div>
    </div>
  );
}
