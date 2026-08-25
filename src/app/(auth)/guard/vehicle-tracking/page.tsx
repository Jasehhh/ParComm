"use client";

import Link from "next/link";
import { ArrowRight, QrCode, ScanLine } from "lucide-react";
import { AppBar } from "@/components/AppBar";

const TOOLS = [
  {
    href: "/guard/vehicle-tracking/scan",
    icon: ScanLine,
    title: "QR code scanner",
    description: "Point the camera at a ticket to log a vehicle in or out.",
    primary: true,
  },
  {
    href: "/guard/vehicle-tracking/generate",
    icon: QrCode,
    title: "QR code generator",
    description: "Issue a printable ticket for a vehicle without one.",
    primary: false,
  },
] as const;

export default function VehicleTrackingPage() {
  return (
    <div className="bg-sand-50 min-h-screen w-full">
      <AppBar title="Vehicle tracking" subtitle="Guard tools" backHref="/guard" />

      <main className="mx-auto w-full max-w-3xl px-4 py-6">
        <div className="grid gap-3.5">
          {TOOLS.map(({ href, icon: Icon, title, description, primary }) => (
            <Link
              key={href}
              href={href}
              className={`group hover:shadow-raised flex items-center gap-4 rounded-[1rem] p-5 transition-all hover:-translate-y-0.5 ${
                primary ? "bg-brand-400 shadow-raised text-white" : "pc-card text-ink-900"
              }`}
            >
              <span
                className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl ${
                  primary ? "bg-white/20" : "bg-brand-50 text-brand-600"
                }`}
              >
                <Icon size={26} strokeWidth={1.9} />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-lg font-bold leading-tight">{title}</span>
                <span
                  className={`mt-0.5 block text-sm ${primary ? "text-white/85" : "text-ink-500"}`}
                >
                  {description}
                </span>
              </span>

              <ArrowRight
                size={20}
                className={`shrink-0 transition-transform group-hover:translate-x-1 ${
                  primary ? "text-white/80" : "text-ink-300"
                }`}
              />
            </Link>
          ))}
        </div>

        <p className="text-ink-400 mt-6 text-xs leading-relaxed">
          Scanning updates lot occupancy instantly for everyone watching the dashboards.
        </p>
      </main>
    </div>
  );
}
