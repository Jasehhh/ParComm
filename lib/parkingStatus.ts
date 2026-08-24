// lib/parkingStatus.ts

export type ParkingStatus = {
  label: "Available" | "Limited" | "Full";
  color: string;
};

// Pure function: same input always produces same output, no side effects
export const getStatus = (percentFull: number): ParkingStatus => {
  if (percentFull >= 85) return { label: "Full", color: "#D33A2C" };
  if (percentFull >= 60) return { label: "Limited", color: "#E2820E" };
  return { label: "Available", color: "#2E9E4F" };
};

// Pure function, no mutation — clamps and computes without touching inputs
export const getPercentFull = (occupied: number, capacity: number): number => {
  if (capacity <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((occupied / capacity) * 100)));
};