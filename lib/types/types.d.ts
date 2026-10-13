export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export type PlateError =
  | { type: "EMPTY"; message: string }
  | { type: "TOO_SHORT"; message: string }
  | { type: "INVALID_CHARS"; message: string }
  | { type: "INVALID_FORMAT"; message: string };

export type CapacityError =
  | { type: "EMPTY"; message: string }
  | { type: "NOT_WHOLE"; message: string }
  | { type: "TOO_LOW"; message: string }
  | { type: "TOO_HIGH"; message: string }
  | { type: "BELOW_OCCUPIED"; message: string }
  | { type: "NOT_FOUND"; message: string }
  | { type: "SAVE_FAILED"; message: string };


export type AppBarProps = {
  title: string;
  subtitle?: string;
  backHref?: string;
  right?: React.ReactNode;
  tone?: "brand" | "plain";
  className?: string;
};

export type LotCardProps = ParkingArea & {
  active?: boolean;
  onSelect?: (id: string) => void;
};

type OccupancyGaugeProps = {
  occupied: number;
  capacity: number;
  size?: number;
  label?: string;
};

type StatTileProps = {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
}

type StatusPillProps = {
  status: ParkingStatus;
  variant?: "soft" | "solid";
  className?: string;
};

type WordmarkProps = {
  withMark?: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
};


export type Result<T, E> = { ok: true; value: T } | { ok: false; error: E };

export type AuthError = { type: "INVALID_CREDENTIALS"; message: string };
