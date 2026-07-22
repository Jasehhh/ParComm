// app/generate-qr-code/plate.ts

// --- Functional error handling: a Result type instead of throw/try-catch ---
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

export type PlateError =
  | { type: "EMPTY"; message: string }
  | { type: "TOO_SHORT"; message: string }
  | { type: "INVALID_CHARS"; message: string };

// --- Pure functions ---
const trimPlate = (raw: string): string => raw.trim();

const upperCasePlate = (plate: string): string => plate.toUpperCase();

const collapseSpaces = (plate: string): string =>
  plate.replace(/\s+/g, " ");

// Pure normalization pipeline — composition of small pure functions
const normalizePlate = (raw: string): string =>
  [trimPlate, collapseSpaces, upperCasePlate].reduce(
    (value, fn) => fn(value),
    raw
  );

// Pure validators — each returns a Result, no side effects
const checkNotEmpty = (plate: string): Result<string, PlateError> =>
  plate.length > 0
    ? ok(plate)
    : err({ type: "EMPTY", message: "Plate number is required." });

const checkMinLength = (plate: string): Result<string, PlateError> =>
  plate.length >= 3
    ? ok(plate)
    : err({ type: "TOO_SHORT", message: "Plate number is too short." });

const checkValidChars = (plate: string): Result<string, PlateError> =>
  /^[A-Z0-9 ]+$/.test(plate)
    ? ok(plate)
    : err({
        type: "INVALID_CHARS",
        message: "Only letters, numbers, and spaces are allowed.",
      });

// Chain validators — a small pure "andThen" combinator for Result
const andThen = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (result.ok ? fn(result.value) : result);

// Composed validation pipeline: normalize -> validate -> validate -> validate
export const parsePlate = (raw: string): Result<string, PlateError> => {
  const normalized = normalizePlate(raw);
  return [checkNotEmpty, checkMinLength, checkValidChars].reduce(
    (result, validator) => andThen(result, validator),
    ok(normalized) as Result<string, PlateError>
  );
};