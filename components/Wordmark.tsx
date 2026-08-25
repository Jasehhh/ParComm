import Image from "next/image";
import type { WordmarkProps } from "@/lib/types/types";

const TEXT_SIZE = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl sm:text-3xl",
} as const;

const MARK_SIZE = { sm: 24, md: 30, lg: 38 } as const;

export function Wordmark({ withMark = false, className = "", size = "md" }: WordmarkProps) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      {withMark && (
        <Image
          src="/parcomm-logo.png"
          alt=""
          width={MARK_SIZE[size]}
          height={MARK_SIZE[size]}
          className="object-contain"
          aria-hidden="true"
        />
      )}
      <span className={`${TEXT_SIZE[size]} font-extrabold leading-none tracking-tight`}>
        <span className="text-brand-400">Par</span>
        <span className="text-brand-600">Comm</span>
      </span>
    </span>
  );
}

export function Tagline({ className = "" }: { className?: string }) {
  return (
    <p className={`text-ink-500 text-xs font-medium ${className}`}>
      Look for place. Occupy space.
    </p>
  );
}
