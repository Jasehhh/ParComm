// app/generate-qr-code/ticket.ts

// --- Functional error handling ---
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

const andThen = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (result.ok ? fn(result.value) : result);

export type PlateError =
  | { type: "EMPTY"; message: string }
  | { type: "TOO_SHORT"; message: string }
  | { type: "INVALID_CHARS"; message: string };

// --- Pure plate normalization (composition of small pure functions) ---
const trimPlate = (raw: string): string => raw.trim();
const collapseSpaces = (plate: string): string => plate.replace(/\s+/g, " ");
const upperCasePlate = (plate: string): string => plate.toUpperCase();

const normalizePlate = (raw: string): string =>
  [trimPlate, collapseSpaces, upperCasePlate].reduce(
    (value, fn) => fn(value),
    raw
  );

// --- Pure validators ---
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

export const parsePlate = (raw: string): Result<string, PlateError> => {
  const normalized = normalizePlate(raw);
  return [checkNotEmpty, checkMinLength, checkValidChars].reduce(
    (result, validator) => andThen(result, validator),
    ok(normalized) as Result<string, PlateError>
  );
};

// --- Ticket data: plate + entry timestamp packaged as JSON ---
export type TicketData = {
  plateNumber: string;
  entryTimestamp: string; // ISO 8601
};

// Pure: builds the ticket record from validated inputs
export const buildTicketData = (
  plateNumber: string,
  entryTimestamp: Date
): TicketData => ({
  plateNumber,
  entryTimestamp: entryTimestamp.toISOString(),
});

// Pure: serializes ticket data to a JSON string (what the QR code encodes)
export const ticketToJson = (ticket: TicketData): string =>
  JSON.stringify(ticket);

// Composed pipeline: raw plate + timestamp -> validated JSON string
export const createTicketPayload = (
  rawPlate: string,
  entryTimestamp: Date
): Result<string, PlateError> =>
  andThen(parsePlate(rawPlate), (plate) =>
    ok(ticketToJson(buildTicketData(plate, entryTimestamp)))
  );