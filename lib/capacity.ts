import { andThen, combineValidators } from "@/lib/functional";
import type { CapacityError, Result } from "@/lib/types/types";

/** Upper bound that catches a slipped key (e.g. 1500 for 150). */
export const MAX_CAPACITY = 2000;

// Pure parse: text in, number or error out. Never throws.
const toNumber = (raw: string): Result<number, CapacityError> => {
  const text = raw.trim();
  return text === ""
    ? { ok: false, error: { type: "EMPTY", message: "Enter a capacity." } }
    : { ok: true, value: Number(text) };
};

// Pure validators
const checkWhole = (capacity: number): Result<number, CapacityError> =>
  Number.isInteger(capacity)
    ? { ok: true, value: capacity }
    : { ok: false, error: { type: "NOT_WHOLE", message: "Capacity must be a whole number." } };

const checkAtLeastOne = (capacity: number): Result<number, CapacityError> =>
  capacity >= 1
    ? { ok: true, value: capacity }
    : { ok: false, error: { type: "TOO_LOW", message: "Capacity must be at least 1." } };

const checkAtMostMax = (capacity: number): Result<number, CapacityError> =>
  capacity <= MAX_CAPACITY
    ? { ok: true, value: capacity }
    : {
        ok: false,
        error: { type: "TOO_HIGH", message: `Capacity cannot exceed ${MAX_CAPACITY}.` },
      };

/**
 * checkNotBelowOccupied — Higher-Order Function
 * Closes over the lot's current occupancy and returns a validator, so the
 * same rule can be built for any lot without reading outside state.
 */
const checkNotBelowOccupied =
  (occupied: number) =>
  (capacity: number): Result<number, CapacityError> =>
    capacity >= occupied
      ? { ok: true, value: capacity }
      : {
          ok: false,
          error: {
            type: "BELOW_OCCUPIED",
            message: `${occupied} vehicles are parked here, so capacity must be at least ${occupied}.`,
          },
        };

/**
 * The capacity rules for one lot, composed into a single validator. Shared by
 * the form (via parseCapacity) and the database write, so the rules live once.
 */
export const validateCapacity = (occupied: number) =>
  combineValidators<number, CapacityError>([
    checkWhole,
    checkAtLeastOne,
    checkAtMostMax,
    checkNotBelowOccupied(occupied),
  ]);

/**
 * Builds the capacity parser for one lot. Curried: give it the occupancy,
 * get back a pure (raw text) -> Result function for that lot's input.
 */
export const parseCapacity =
  (occupied: number) =>
  (raw: string): Result<number, CapacityError> =>
    andThen(toNumber(raw), validateCapacity(occupied));
