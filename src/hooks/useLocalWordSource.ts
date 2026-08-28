import { useState } from 'react'
import { LocalWordSource } from '../wordSources/LocalWordSource'

export function useLocalWordSource() {
  const [source] = useState(() => new LocalWordSource())
  const [words, setWords] = useState(source.getWords())

  const addWord = (word: string) => {
    source.addWord(word)
    setWords([...source.getWords()]) // splat to get new array reference
  }

  const removeWord = () => {
    const removed = source.removeWord()
    setWords([...source.getWords()])
    return removed
  }

  const count = source.count()

  return { words, addWord, removeWord, count }
}

