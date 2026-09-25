# 🥗 Salad Bowl — Seam Doc

**Status:** Milestone 2 deliverable — written regardless of milestone 3 progress
**Related:** [Salad Bowl project](https://app.notion.com/p/3abf662020b1816f833ce6a3a567da0f) · [Write the seam doc](https://app.notion.com/p/3b2f662020b1811a832ae5fd73a74e14)

## Objective

Capture what a cold read needs to pick milestone 3 (the async word-submission layer) back up in Vietnam without re-deriving decisions already made: the `WordSource` contract as it actually exists in code, a sketch of the room/word data model, and a concrete list of what's left.

## Background

Milestone 1 (local MVP) is wrapping up; milestone 2 is this doc. The MVP was deliberately built behind a `WordSource` interface so a swap to a remote implementation wouldn't touch game logic — but "swappable" only counts if the seam is documented before a six-week gap. This doc closes that gap: read cold, picking milestone 3 back up shouldn't require rediscovering how the current pieces fit together.

## The `WordSource` interface, as implemented

Location: `src/types.ts`

\`\`\`ts
export interface WordSource {
  // The maximum number of words this bowl can hold
  maxWords: number
  // Adds a word to the bowl. Returns false if rejected (e.g. duplicate, empty).
  addWord(word: Word): boolean
  // Removes a word from the bowl. Returns false if the word wasn't found.
  removeWord(word: Word): boolean
  // Returns all words in the bowl
  getWords(): readonly Word[]
  // Count words in the bowl
  count(): number
}
\`\`\`

Today's only implementation is `LocalWordSource` (`src/wordSources/LocalWordSource.ts`), which:

- rejects empty/normalized-duplicate words (via `normalizeWord`)
- enforces `minWordLength`/`maxWordLength` (3–50 chars) and `maxWords`
- holds words in a private in-memory array; `getWords()` always returns a fresh copy so consumers can't mutate internal state by reference

**How it's actually consumed** (this is the part worth documenting — it's not obvious from the interface alone):

- `App.tsx` constructs one `LocalWordSource` per game (`maxWords = totalPlayers * wordsPerPlayer`) and passes it down as a prop; it's rebuilt from scratch on every new game.
- `WordEntryScreen` is the only place that calls `addWord`/`removeWord`, via the `useWordSource` hook, which just mirrors the source's internal list into React state after each call.
- `GameplayScreen` calls `source.getWords()` exactly once per round (in `startRound`/`prepareRound`), to seed a local `bowl` array. From that point, gameplay logic (`pickWord`, `switchWord`, `winWord`, `skipWord`) only ever mutates that local `bowl` copy — **it never calls back into `source`** for the rest of the round.
- `maxWords` is only ever read by `LocalWordSource.addWord` itself; nothing outside the class consults it.

This matters for milestone 3: a `RemoteWordSource` only needs to answer `getWords()` correctly by the moment `GameplayScreen` starts a round — it doesn't need to support live updates mid-round, and `addWord`/`removeWord` may not even be meaningful for a remote source, since submissions would arrive through the public form rather than through the host's `WordEntryScreen`. Flagged as an open question below rather than assumed.
