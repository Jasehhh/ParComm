// lib/functional.ts
/**
 * pipe — Higher-Order Function + Function Composition
 * Takes multiple single-argument functions and combines them into one function
 * that runs them left-to-right, passing each result to the next.
 */
export const pipe = <T>(...fns: Array<(arg: T) => T>) =>
  (initialValue: T): T =>
    fns.reduce((value, fn) => fn(value), initialValue);

/**
 * Result type — shared shape for Functional Error Handling
 */
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/**
 * andThen — Higher-Order Function
 * Chains a Result-returning function onto a previous Result,
 * short-circuiting if the previous step already failed.
 */
export const andThen = <T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> => (result.ok ? fn(result.value) : result);

/**
 * combineValidators — Higher-Order Function
 * Takes an array of validator functions and combines them into
 * a single validation pipeline, run left-to-right.
 */
export const combineValidators = <T, E>(
  validators: Array<(value: T) => Result<T, E>>
) => (value: T): Result<T, E> =>
  validators.reduce(
    (result, validator) => andThen(result, validator),
    { ok: true, value } as Result<T, E>
  );

// ==========================================
// INPUT VALIDATORS & FORMATTERS
// ==========================================

export const validateNonEmpty = (value: string): Result<string, string> =>
  value.trim().length > 0
    ? { ok: true, value: value.trim() }
    : { ok: false, error: "Field cannot be empty." };

export const validatePlateFormat = (plate: string): Result<string, string> => {
  const formatted = plate.toUpperCase();
  const plateRegex = /^[A-Z]{3}-\d{3,4}$/;

  return plateRegex.test(formatted)
    ? { ok: true, value: formatted }
    : { ok: false, error: "Invalid format. Standard format: ABC-123 or ABC-1234." };
};

export const validatePlateNumber = (plate: string): Result<string, string> =>
  combineValidators<string, string>([
    validateNonEmpty,
    validatePlateFormat,
  ])(plate);

export const validateCapacityThreshold = (
  capacityInput: string | number,
  maxThreshold: number = 50
): Result<number, string> => {
  const capacity = typeof capacityInput === "string" ? Number(capacityInput) : capacityInput;

  if (capacityInput === "" || capacityInput === null || capacityInput === undefined) {
    return { ok: false, error: "Capacity is required." };
  }

  if (isNaN(capacity)) {
    return { ok: false, error: "Capacity must be a valid number." };
  }

  if (capacity <= 0) {
    return { ok: false, error: "Capacity must be greater than zero." };
  }

  if (capacity > maxThreshold) {
    return {
      ok: false,
      error: `Capacity exceeds maximum allowed threshold of ${maxThreshold}.`,
    };
  }

  return { ok: true, value: capacity };
};

export const formatPlateInput = (input: string): string => {
  const clean = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const letters = clean.slice(0, 3).replace(/[^A-Z]/g, "");
  const rest = clean.slice(letters.length);

  if (letters.length === 3) {
    return `${letters}-${rest}`;
  }

  return letters;
};