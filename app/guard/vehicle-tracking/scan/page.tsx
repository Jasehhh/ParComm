"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
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
    const scanner = new Html5Qrcode("qr-reader");
    scannerRef.current = scanner;

    function handleScanResult(decodedText: string) {
      try {
        const data = JSON.parse(decodedText);
        router.push(`/guard/vehicle-tracking?scanned=${data.plate}`);
      } catch {
        setError("Invalid QR code");
      }
    }

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          scanner.stop().then(() => handleScanResult(decodedText));
        },
        () => {}
      )
      .catch((err) => setError("Camera access failed: " + err));

    return () => {
      scannerRef.current?.stop().catch(() => {});
    };
  }, [router]);

  return (
    <div
      className={`${inter.variable} min-h-screen w-full flex flex-col`}
      style={{ fontFamily: "var(--font-inter)" }}
    >
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