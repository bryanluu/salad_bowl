import { useState } from "react"
import { useLocalWordSource } from "../hooks/useLocalWordSource"
import type { Word } from "../types.ts"
import { validateWord } from "../validation/validateWord.ts"

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
