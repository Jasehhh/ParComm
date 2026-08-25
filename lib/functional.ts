// lib/functional.ts
import { Result } from "@/lib/types/types";
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

/**
 * converge — Higher-Order Function
 * Feeds one input to several functions, then combines their results.
 * Lets a value be split, transformed independently, and rejoined without
 * introducing intermediate variables.
 */
export const converge =
  <T, A, B, R>(combine: (a: A, b: B) => R, toA: (value: T) => A, toB: (value: T) => B) =>
  (value: T): R =>
    combine(toA(value), toB(value));

/**
 * combinePredicates — Higher-Order Function
 * Merges independent predicates into a single one that holds only when every
 * predicate holds. The counterpart of combineValidators for plain filtering.
 */
export const combinePredicates =
  <T>(predicates: Array<(value: T) => boolean>) =>
  (value: T): boolean =>
    predicates.every((predicate) => predicate(value));

/**
 * unique — pure de-duplication, preserving first-seen order.
 * Returns a new array; the input is never touched.
 */
export const unique = <T>(items: readonly T[]): T[] =>
  items.filter((item, index) => items.indexOf(item) === index);

/**
 * sortBy — Higher-Order Function
 * Orders by a derived key. Copies first, so unlike Array.prototype.sort it
 * leaves the input array unchanged.
 */
export const sortBy =
  <T>(toKey: (value: T) => string) =>
  (items: readonly T[]): T[] =>
    [...items].sort((a, b) => toKey(a).localeCompare(toKey(b)));