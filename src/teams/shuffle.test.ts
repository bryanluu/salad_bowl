// src/teams/shuffle.test.ts
import { describe, it, expect, vi, afterEach } from 'vitest'
import { shuffle } from './shuffle'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('shuffle', () => {
  it('returns a permutation of the input', () => {
    const input = ['a', 'b', 'c', 'd', 'e']
    const result = shuffle(input)

    expect(result).toHaveLength(input.length)
    expect([...result].sort()).toEqual([...input].sort())
  })

  it('does not mutate the input array', () => {
    const input = ['a', 'b', 'c', 'd']

    shuffle(input)

    expect(input).toEqual(['a', 'b', 'c', 'd'])
  })

  it('returns an empty array for an empty input', () => {
    expect(shuffle([])).toEqual([])
  })

  it('keeps a single element in place', () => {
    expect(shuffle([42])).toEqual([42])
  })

  it('shuffles objects as well as primitives', () => {
    const teams = [{ id: '1' }, { id: '2' }, { id: '3' }]
    const result = shuffle(teams)

    expect(result).toHaveLength(3)
    expect(result.map(t => t.id).sort()).toEqual(['1', '2', '3'])
  })

  it('applies the Knuth shuffle deterministically for a fixed RNG', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)

    expect(shuffle([1, 2, 3, 4, 5])).toEqual([1, 4, 2, 5, 3])
  })
})
