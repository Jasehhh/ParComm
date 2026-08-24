import type { ParkingStatus } from "@/lib/parkingStatus";

type StatusPillProps = {
  status: ParkingStatus;
  /** solid = filled chip, soft = tinted chip with colored text */
  variant?: "soft" | "solid";
  className?: string;
};

export function StatusPill({ status, variant = "soft", className = "" }: StatusPillProps) {
  const soft = variant === "soft";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none ${className}`}
      style={
        soft
          ? {
              backgroundColor: `color-mix(in srgb, ${status.color} 14%, transparent)`,
              color: `color-mix(in srgb, ${status.color} 82%, #1c1814)`,
            }
          : { backgroundColor: status.color, color: "#fff" }
      }
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: soft ? status.color : "#fff" }}
        aria-hidden="true"
      />
      {status.label}
    </span>
  );
}
