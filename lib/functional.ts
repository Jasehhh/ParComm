// lib/functional.ts
import { Result } from "@/lib/types";
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
 * (matches the one used plate.ts in authResult.ts)
 */

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