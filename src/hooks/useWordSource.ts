// src/hooks/useLocalWordSource.ts
import { useState } from 'react'
import type { Word, WordSource } from '../types'

export function useWordSource(source: WordSource) {
  const [words, setWords] = useState(source.getWords())

  const addWord = (word: Word): boolean => {
    const success = source.addWord(word)
    if (success) setWords(source.getWords())
    return success
  }

  const removeWord = (word: Word): boolean => {
    const success = source.removeWord(word)
    if (success) setWords(source.getWords())
    return success
  }

  const pickWord = (): Word | null => {
    const picked = source.pickWord()
    if (picked !== null) setWords(source.getWords())
    return picked
  }

  return { words, addWord, removeWord, pickWord, count: words.length }
}

