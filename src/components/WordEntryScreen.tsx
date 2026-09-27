import { useEffect, useRef, useState } from "react"
import { useWordSource } from "../hooks/useWordSource.ts"
import { maxWordLength, type Word, minWordLength, type GameConfig, type WordSource } from "../types.ts"
import { validateWord } from "../validation/validateWord.ts"
import { validateBowl } from "../validation/validateBowl.ts"
import { copy } from "../copy/en.ts"
import { generateWord } from "../words/generateWord.ts"
import { useSound } from "../context/useSound"

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

function WordEntryScreen({ config, source, onSubmitWords }:
  { config: GameConfig, source: WordSource, onSubmitWords: () => void }) {
  const { words, addWord, removeWord, count } = useWordSource(source)
  const [candidateWord, setCandidateWord] = useState("")
  const doneButtonRef = useRef<HTMLButtonElement>(null)
  const wordInputRef = useRef<HTMLInputElement>(null)
  const [bowlFilledOnceAlready, setBowlFilledOnceAlready] = useState(false)
  const { play } = useSound()

  const wordValidation = validateWord(candidateWord, words)
  const bowlValidation = validateBowl(words, source.maxWords)

  useEffect(function focusDoneButtonWhenBowlReady() {
    if (count >= source.maxWords) {
      doneButtonRef.current?.focus()
    } else {
      wordInputRef.current?.focus()
    }
  }, [count, source])

  function handleWordEdit(event: React.ChangeEvent<HTMLInputElement>) {
    const candidate: Word = event.currentTarget.value
    setCandidateWord(candidate)
  }

  function handleGenerateWord() {
    let generated
    do {
      generated = generateWord()
    } while (!validateWord(generated, words).ok)
    setCandidateWord(generated);
  }

  function handleAddWord() {
    const success = addWord(candidateWord)
    if (success) {
      setCandidateWord("")
      if (!bowlFilledOnceAlready && count + 1 === source.maxWords)
        setBowlFilledOnceAlready(true)
    }
  }

  function handleRemoveWord(word: Word) {
    return () => removeWord(word)
  }

  // SFX: tap — general action-button sound (see sounds.ts). This is the
  // one button on this screen wired to a sound: Done is a commit action
  // that leaves the screen, unlike Add prompt/Generate prompt/Remove
  // above, which fire on every rapid micro-interaction while a player is
  // still drafting their words — sound-effecting those would get noisy
  // fast rather than useful (see the SB-50 ticket's design notes).
  function handleDone() {
    play('tap')
    onSubmitWords()
  }

  return (
    <section className="screen" aria-labelledby="word-entry-title">
      <header className="screen__header">
        <h1 className="screen__title" id="word-entry-title">
          {copy.wordEntry.title}
        </h1>
      </header>

      {(count < source.maxWords) && <form className="input-add" onSubmit={(event) => event.preventDefault()}>
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
          disabled={(count >= source.maxWords)}
          ref={wordInputRef}
          required
        />
        <button
          className="btn btn--secondary btn--icon"
          type="submit"
          aria-label={copy.wordEntry.addButton}
          onClick={handleAddWord}
          disabled={!wordValidation.ok || (count >= source.maxWords)}
        >
          +
        </button>
      </form>}

      {!wordValidation.ok && wordValidation.reason !== 'empty' && (
        <p className="input-add__error" id="word-input-error" role="status">
          {copy.wordEntry.errors[wordValidation.reason]}
        </p>
      )}

      {config.hideWordsDuringEntry ?
        // TODO: add more complex behaviour once rooms are implemented
        <p>{copy.wordEntry.hiddenWords}</p>
        :
        <ul className="word-list">
          {words.map((word) => <WordEntry key={word} word={word} onClick={handleRemoveWord(word)} />)}
        </ul>}

      <p className="counter">{copy.wordEntry.counter(count, source.maxWords)}</p>

      {!bowlValidation.ok && bowlFilledOnceAlready && (
        <p className="done__error" id="done-error" role="status">
          {copy.wordEntry.errors[bowlValidation.reason]}
        </p>
      )}

      {count < source.maxWords &&
        <button
          className="btn btn--secondary"
          type="button"
          aria-label={copy.wordEntry.generateButton}
          onClick={handleGenerateWord}
          disabled={count >= source.maxWords}
        >
          {copy.wordEntry.generateButton} ⚂
        </button>}

      <button
        className="btn btn--primary"
        type="button"
        ref={doneButtonRef}
        disabled={!bowlValidation.ok}
        aria-describedby={!wordValidation.ok ? 'done-error' : undefined}
        onClick={handleDone}
      >
        {copy.wordEntry.doneButton}
      </button>
    </section>
  )
}

export default WordEntryScreen
