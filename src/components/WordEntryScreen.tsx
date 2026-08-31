import { useState } from "react"
import { useLocalWordSource } from "../hooks/useLocalWordSource"
import { maxWordLength, type Word, minWordLength } from "../types.ts"
import { validateWord } from "../validation/validateWord.ts"
import { copy } from "../copy/en.ts"

function WordEntry({ word, onClick }: { word: Word, onClick: () => void }) {
  return (
    <li className="word-list__item">
      <span>{word}</span>
      <button className="word-list__remove" type="button" aria-label={copy.wordEntry.removeLabel} onClick={onClick}>
        &times;
      </button>
    </li>
  )
}

function WordEntryScreen() {
  const config = { totalWords: 20 } // TODO: incorporate custom config from Game Setup
  const { words, addWord, removeWord, count } = useLocalWordSource()
  const [candidateWord, setCandidateWord] = useState("")

  const validation = validateWord(candidateWord, words)

  function handleWordEdit(event: React.ChangeEvent<HTMLInputElement>) {
    const candidate: Word = event.currentTarget.value
    setCandidateWord(candidate)
  }

  function handleAddWord() {
    const success = addWord(candidateWord)
    if (success) {
      setCandidateWord("")
    }
  }

  function handleRemoveWord(word: Word) {
    return () => removeWord(word)
  }

  return (
    <section className="screen" aria-labelledby="word-entry-title">
      <header className="screen__header">
        <h1 className="screen__title" id="word-entry-title">
          {copy.wordEntry.title}
        </h1>
      </header>

      <form className="input-add" onSubmit={(event) => event.preventDefault()}>
        <label className="sr-only" htmlFor="word-input">
          Word
        </label>
        <input
          className="input"
          id="word-input"
          type="text"
          placeholder={copy.wordEntry.placeholder}
          onChange={handleWordEdit}
          aria-describedby={!validation.ok ? "word-input-error" : undefined}
          aria-invalid={!validation.ok}
          value={candidateWord}
          minLength={minWordLength}
          maxLength={maxWordLength}
          required
        />
        <button
          className="btn btn--secondary btn--icon"
          type="submit"
          aria-label={copy.wordEntry.addButton}
          onClick={handleAddWord}
          disabled={!validation.ok}
        >
          +
        </button>
      </form>

      {!validation.ok && candidateWord !== "" && (
        <p className="input-add__error" id="word-input-error" role="status">
          {copy.wordEntry.errors[validation.reason]}
        </p>
      )}

      <ul className="word-list">
        {words.map((word) => <WordEntry key={word} word={word} onClick={handleRemoveWord(word)} />)}
      </ul>

      <p className="counter">{copy.wordEntry.counter(count, config.totalWords)}</p>

      <button className="btn btn--primary" type="button">
        {copy.wordEntry.doneButton}
      </button>
    </section>
  )
}

export default WordEntryScreen
