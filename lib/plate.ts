// app/guard/vehicle-tracking/generate/plate.ts
import { pipe, combineValidators} from "@/lib/functional";
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

const checkValidChars = (plate: string): Result<string, PlateError> =>
  /^[A-Z0-9 ]+$/.test(plate)
    ? { ok: true, value: plate }
    : {
        ok: false,
        error: { type: "INVALID_CHARS", message: "Only letters, numbers, and spaces are allowed." },
      };

// Composed pipeline, using shared combineValidators()
const validatePlate = combineValidators([checkNotEmpty, checkMinLength, checkValidChars]);

export const parsePlate = (raw: string): Result<string, PlateError> =>
  validatePlate(normalizePlate(raw));