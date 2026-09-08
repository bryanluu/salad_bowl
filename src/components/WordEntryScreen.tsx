import { useState } from "react"
import { useLocalWordSource } from "../hooks/useLocalWordSource"
import { maxWordLength, type Word, minWordLength, type GameConfig } from "../types.ts"
import { validateWord } from "../validation/validateWord.ts"
import { validateBowl } from "../validation/validateBowl.ts"
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

function WordEntryScreen({ config }: { config: GameConfig }) {
  const maxWords = config.totalPlayers * config.wordsPerPlayer

  const { words, addWord, removeWord, count } = useLocalWordSource(maxWords)
  const [candidateWord, setCandidateWord] = useState("")

  const wordValidation = validateWord(candidateWord, words)
  const bowlValidation = validateBowl(words, maxWords)

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
          aria-describedby={!wordValidation.ok ? "word-input-error" : undefined}
          aria-invalid={!wordValidation.ok}
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
          disabled={!wordValidation.ok}
        >
          +
        </button>
      </form>

      {!wordValidation.ok && wordValidation.reason !== 'empty' && (
        <p className="input-add__error" id="word-input-error" role="status">
          {copy.wordEntry.errors[wordValidation.reason]}
        </p>
      )}

      <ul className="word-list">
        {words.map((word) => <WordEntry key={word} word={word} onClick={handleRemoveWord(word)} />)}
      </ul>

      <p className="counter">{copy.wordEntry.counter(count, maxWords)}</p>

      {!bowlValidation.ok && (
        <p className="done__error" id="done-error" role="status">
          {copy.wordEntry.errors[bowlValidation.reason]}
        </p>
      )}

      <button
        className="btn btn--primary"
        type="button"
        disabled={!bowlValidation.ok}
        aria-describedby={!wordValidation.ok ? 'done-error' : undefined}>
        {copy.wordEntry.doneButton}
      </button>
    </section>
  )
}

export default WordEntryScreen
