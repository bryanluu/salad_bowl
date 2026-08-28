import { useState } from "react"
import { useLocalWordSource } from "../hooks/useLocalWordSource"
import type { Word } from "../types.ts"

/** Trim, collapse runs of separators (space/dash/underscore) to a single
 *  space, lowercase. So "Ice_Cream" ≡ "ice cream" ≡ "ice–cream". */
function normalizeWord(raw: string): string {
  return raw
    .trim()
    // .replace(/[\s_-–—]+/g, ' ')
    .toLowerCase()
}

type Rejection =
  | { reason: 'empty'; message: 'That\'s not a word yet — type a few letters first.' }
  | { reason: 'duplicate'; message: 'Already in the bowl.' }

function validateWord(candidate: Word, existing: readonly Word[]): { ok: true } | Rejection {
  const normalized = normalizeWord(candidate)
  console.log(normalized)
  if (normalized === '') return { reason: 'empty', message: 'That\'s not a word yet — type a few letters first.' }
  if (existing.some((word) => normalizeWord(word) === normalized)) {
    return { reason: 'duplicate', message: 'Already in the bowl.' }
  }
  return { ok: true }
}

function WordEntry({ word }: { word: Word }) {
  return (
    <li className="word-list__item">
      <span>{word}</span>
      <button className="word-list__remove" type="button" aria-label="Remove word">
        &times;
      </button>
    </li>
  )
}

function WordEntryScreen() {
  const { words, addWord, removeWord, count } = useLocalWordSource()
  const [candidateWord, setCandidateWord] = useState("")

  const validation = validateWord(candidateWord, words)

  function handleWordEdit(event: React.ChangeEvent<HTMLInputElement>) {
    const candidate: Word = event.currentTarget.value
    setCandidateWord(candidate)
  }

  function handleAddWord() {
    addWord(candidateWord)
    setCandidateWord("")
  }

  return (
    <section className="screen" aria-labelledby="word-entry-title">
      <header className="screen__header">
        <h1 className="screen__title" id="word-entry-title">
          Add your words
        </h1>
      </header>

      <form className="input-add" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="word-input">
          Word
        </label>
        <input className="input" id="word-input" type="text" placeholder="Enter a word" onChange={handleWordEdit} value={candidateWord} />
        <button
          className="btn btn--secondary btn--icon"
          type="submit"
          aria-label="Add word"
          onClick={handleAddWord}
          disabled={!validation.ok}
        >
          +
        </button>
      </form>

      <ul className="word-list">
        {words.map((word, idx) => <WordEntry key={idx} word={word} />)}
      </ul>

      <p className="counter">{count} / 20 words</p>

      <button className="btn btn--primary" type="button">
        Done adding words
      </button>
    </section >
  )
}

export default WordEntryScreen
