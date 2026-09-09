/** Return a new array with the elements in random order (Knuth shuffle).
 *  Walks from the end of the array, swapping each element with a randomly
 *  chosen one at or before it. Generic over the element type, and the input
 *  array is left untouched. */
export function shuffle<T>(items: readonly T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = result[i]
    result[i] = result[j]
    result[j] = temp
  }
  return result
}
