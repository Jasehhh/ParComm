// app/guard/vehicle-tracking/generate/plate.ts
import { pipe, combineValidators, converge } from "@/lib/functional";
import { Result } from "@/lib/types/types";
import { PlateError } from "@/lib/types/types";

// --- Pure normalization, composed via shared pipe() ---
const trimPlate = (raw: string): string => raw.trim();
const collapseSpaces = (plate: string): string => plate.replace(/\s+/g, " ");
const upperCasePlate = (plate: string): string => plate.toUpperCase();

const normalizePlate = pipe(trimPlate, collapseSpaces, upperCasePlate);

// --- Pure validators ---
const checkNotEmpty = (plate: string): Result<string, PlateError> =>
  plate.length > 0
    ? { ok: true, value: plate }
    : { ok: false, error: { type: "EMPTY", message: "Plate number is required." } };

const checkMinLength = (plate: string): Result<string, PlateError> =>
  plate.length >= 3
    ? { ok: true, value: plate }
    : { ok: false, error: { type: "TOO_SHORT", message: "Plate number is too short." } };

const checkValidFormat = (plate: string): Result<string, PlateError> =>
  /^[A-Z]{3}-[0-9]{4}$/.test(plate)
    ? { ok: true, value: plate }
    : {
        ok: false,
        error: { type: "INVALID_FORMAT", message: "Plate number must follow the format ABC-1234." },
      };

// Composed pipeline, using shared combineValidators()
const validatePlate = combineValidators([checkNotEmpty, checkMinLength, checkValidFormat]);

export const parsePlate = (raw: string): Result<string, PlateError> =>
  validatePlate(normalizePlate(raw));

// --- Pure input formatting, composed the same way ---
// Each step is a small total function; converge() splits the normalized text
// into its letter and digit parts and joins them back into ABC-1234 shape.
const lettersOf = (plate: string): string =>
  (plate.match(/[A-Z]/g) ?? []).slice(0, 3).join("");

const digitsOf = (plate: string): string =>
  (plate.match(/[0-9]/g) ?? []).slice(0, 4).join("");

const joinPlate = (letters: string, digits: string): string =>
  letters.length === 3 ? `${letters}-${digits}` : letters;

/**
 * Formats raw keystrokes into a partial plate, inserting the dash once three
 * letters are present. Pure: same input always yields the same output.
 */
export const formatPlateInput = pipe<string>(
  upperCasePlate,
  converge(joinPlate, lettersOf, digitsOf)
);

/** True when the text is a complete, well-formed plate. */
export const isCompletePlate = (plate: string): boolean =>
  /^[A-Z]{3}-[0-9]{4}$/.test(plate);
