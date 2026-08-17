"use client";

import Link from "next/link";
import { ChevronLeft, ScanQrCode, QrCode } from "lucide-react";
import { Inter } from "next/font/google";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export default function VehicleTrackingPage() {
  return (
    <div
      className={`${inter.variable} min-h-screen w-full p-4 flex flex-col gap-[clamp(14px,2.5vw,20px)]`}
      style={{ fontFamily: "var(--font-inter)", backgroundColor: "#F6F2D9" }}
    >
      <Link
        href="/guard"
        className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 text-black font-bold"
      >
        <ChevronLeft size={22} />
        <span className="text-[clamp(15px,2vw,19px)]">Vehicle Tracking</span>
      </Link>

      <Link
        href="/guard/vehicle-tracking/scan"
        className="rounded-[16px] p-[clamp(24px,5vw,36px)] flex flex-col items-center gap-[clamp(6px,1vw,10px)] text-center"
        style={{ backgroundColor: "#F5A623" }}
      >
        <ScanQrCode size={56} strokeWidth={1.5} className="text-white" />
        <span className="font-bold text-white text-[clamp(16px,2.2vw,20px)]">QR Code Scanner</span>
        <span className="text-black/70 text-[clamp(10px,1.3vw,13px)]">Scan QR to log vehicles.</span>
      </Link>

      <Link
        href="/guard/vehicle-tracking/generate"
        className="rounded-[16px] p-[clamp(24px,5vw,36px)] flex flex-col items-center gap-[clamp(6px,1vw,10px)] text-center"
        style={{ backgroundColor: "#F5A623" }}
      >
        <QrCode size={56} strokeWidth={1.5} className="text-white" />
        <span className="font-bold text-white text-[clamp(16px,2.2vw,20px)]">QR Code Generator</span>
        <span className="text-black/70 text-[clamp(10px,1.3vw,13px)]">Create a QR Code for new vehicles.</span>
      </Link>
    </div>
  );
}
