"use client";

import Link from "next/link";
import { ChevronLeft, QrCode, ScanQrCode } from "lucide-react";

export default function VehicleTrackingPage() {
  return (
    <div className="min-h-screen w-full bg-[#F6F2D9] p-4 font-sans flex flex-col gap-[clamp(14px,2.5vw,20px)]">
      <div className="-mx-4 -mt-4 flex items-center gap-2 bg-[#F5A623] px-4 py-4 font-bold text-black">
        <Link href="/auth/guard" className="flex cursor-pointer items-center" aria-label="Go back">
          <ChevronLeft size={22} />
        </Link>
        <span className="text-[clamp(15px,2vw,19px)]">Vehicle Tracking</span>
      </div>

      <Link
        href="/auth/guard/vehicle-tracking/scan"
        className="flex flex-col items-center gap-[clamp(6px,1vw,10px)] rounded-[16px] bg-[#F5A623] p-[clamp(24px,5vw,36px)] text-center"
      >
        <ScanQrCode size={56} strokeWidth={1.5} className="text-white" />
        <span className="text-[clamp(16px,2.2vw,20px)] font-bold text-white">QR Code Scanner</span>
        <span className="text-[clamp(10px,1.3vw,13px)] text-black/70">Scan QR to log vehicles.</span>
      </Link>

      <Link
        href="/auth/guard/vehicle-tracking/generate"
        className="flex flex-col items-center gap-[clamp(6px,1vw,10px)] rounded-[16px] bg-[#F5A623] p-[clamp(24px,5vw,36px)] text-center"
      >
        <QrCode size={56} strokeWidth={1.5} className="text-white" />
        <span className="text-[clamp(16px,2.2vw,20px)] font-bold text-white">QR Code Generator</span>
        <span className="text-[clamp(10px,1.3vw,13px)] text-black/70">Create a QR Code for new vehicles.</span>
      </Link>
    </div>
  );
}
