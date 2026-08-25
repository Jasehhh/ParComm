"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AppBarProps } from "@/lib/types/types";

export function AppBar({
  title,
  subtitle,
  backHref,
  right,
  tone = "brand",
  className = "",
}: AppBarProps) {
  const router = useRouter();

  const label = (
    <span className="min-w-0">
      <span className="block truncate text-base font-bold leading-tight">{title}</span>
      {subtitle && (
        <span
          className={`block truncate text-xs ${tone === "brand" ? "text-ink-900/65" : "text-ink-500"}`}
        >
          {subtitle}
        </span>
      )}
    </span>
  );

  const backClasses =
    "-ml-1 flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors " +
    (tone === "brand" ? "hover:bg-black/10" : "hover:bg-sand-100");

  return (
    <header
      className={`sticky top-0 z-20 ${
        tone === "brand"
          ? "bg-brand-400 text-ink-900"
          : "border-sand-200 bg-sand-50/90 text-ink-900 border-b backdrop-blur"
      } ${className}`}
    >
      <div className="mx-auto flex w-full max-w-5xl items-center gap-2 px-4 py-3">
        {backHref ? (
          <Link href={backHref} className={backClasses} aria-label="Go back">
            <ChevronLeft size={22} />
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => router.back()}
            className={backClasses}
            aria-label="Go back"
          >
            <ChevronLeft size={22} />
          </button>
        )}
        {label}
        {right && <div className="ml-auto shrink-0">{right}</div>}
      </div>
    </header>
  );
}
