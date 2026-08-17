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
        router.push(`/guard/vehicle-tracking?scanned=${data.plate}`);
      } catch {
        setError("Invalid QR code");
      }
    }

    // Delaying startup by one frame lets React Strict Mode cancel its test mount
    // before html5-qrcode adds a video element to the reader container.
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
    <div className="min-h-screen w-full flex flex-col">
      <div className="p-4" style={{ backgroundColor: "#F5A623" }}>
        <Link href="/guard/vehicle-tracking" className="flex items-center gap-2 text-black font-bold">
          <ChevronLeft size={22} />
          <span className="text-lg">Scan QR Code</span>
        </Link>
      </div>

      <div className="bg-black flex-1 flex flex-col items-center justify-center gap-5 p-6">
        <div
          id="qr-reader"
          className="w-full max-w-[280px] aspect-square rounded-[12px] overflow-hidden"
          style={{ border: "2px solid #F5A623" }}
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <p className="text-white/70 text-sm mb-4">Align the QR code inside frame.</p>
      </div>
    </div>
  );
}
