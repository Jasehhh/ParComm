import { pipe, combineValidators, type Result } from "@/lib/functional";

export type PlateError =
  | { type: "EMPTY"; message: string }
  | { type: "INVALID_FORMAT"; message: string };

/**
 * Auto-formats plate input:
 * Inserts hyphen after 3 letters while retaining trailing digits for validation.
 */
export const formatPlateInput = (input: string): string => {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = clean.slice(0, 3).replace(/[^A-Z]/g, "");
  const rest = clean.slice(letters.length);

  if (letters.length === 3) {
    return `${letters}-${rest}`;
  }

  return letters;
};

const trimPlate = (raw: string): string => raw.trim();
const upperCasePlate = (plate: string): string => plate.toUpperCase();

const normalizePlate = pipe(trimPlate, upperCasePlate);

// --- Pure validators ---
const checkNotEmpty = (plate: string): Result<string, PlateError> =>
  plate.length > 0
    ? { ok: true, value: plate }
    : { ok: false, error: { type: "EMPTY", message: "Plate number is required." } };

/**
 * Validates strict plate format:
 * Expects 3 letters + hyphen + 3 or 4 digits ONLY (e.g. ABC-123 or ABC-1234).
 */
const checkPlateFormat = (plate: string): Result<string, PlateError> =>
  /^[A-Z]{3}-\d{3,4}$/.test(plate)
    ? { ok: true, value: plate }
    : {
        ok: false,
        error: {
          type: "INVALID_FORMAT",
          message: "Invalid format. Plate must be 3 letters followed by 3 or 4 digits (e.g., ABC-1234).",
        },
      };

// Composed pipeline using shared combineValidators()
const validatePlate = combineValidators([checkNotEmpty, checkPlateFormat]);

export const parsePlate = (raw: string): Result<string, PlateError> =>
  validatePlate(normalizePlate(raw));