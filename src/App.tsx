import { useState } from 'react'
import StartScreen from './components/StartScreen'
import WordEntryScreen from './components/WordEntryScreen'
import GameSetupScreen from './components/GameSetupScreen'
import GameplayScreen from './components/GameplayScreen'
import Footer from './components/Footer'
import { LocalWordSource } from './wordSources/LocalWordSource'
import { copy } from './copy/en.ts'
import type {
  ScreenId,
  GameConfig,
  WordSource,
} from './types'

type ScreenProps = {
  source: WordSource
  config: GameConfig
  onCommitConfig: (newConfig: GameConfig) => void
  onNewGame: () => void
  onSubmitWords: () => void
}

function renderScreen(screenId: ScreenId,
  {
    source,
    config,
    onCommitConfig,
    onNewGame,
    onSubmitWords,
  }: ScreenProps) {
  switch (screenId) {
    case 'start':
      return <StartScreen onStart={onNewGame} />
    case 'game-setup':
      return <GameSetupScreen config={config} onSubmit={onCommitConfig} />
    case 'word-entry':
      return <WordEntryScreen config={config} source={source} onSubmitWords={onSubmitWords} />
    case 'gameplay':
      return <GameplayScreen
        config={config}
        source={source}
        onNewGame={onNewGame} />
  }
}

const defaultGameConfig: GameConfig = {
  totalPlayers: 4,
  teams: [
    { id: 'team-1', name: 'Team 1', players: 2 },
    { id: 'team-2', name: 'Team 2', players: 2 },
  ],
  timerSeconds: 30,
  wordsPerPlayer: 5,
  shuffleTeamOrder: true,
  hideWordsDuringEntry: true,
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('start')
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig)
  const [source, setSource] = useState(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))
  const started = (activeScreen !== 'start')

  function resetSource() {
    setSource(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))
  }

  function switchScreen(newScreenId: ScreenId) {
    setActiveScreen(() => newScreenId)
  }

  function handleSubmitConfig(newConfig: GameConfig) {
    setGameConfig(newConfig)
    setSource(() => new LocalWordSource(newConfig.totalPlayers * newConfig.wordsPerPlayer))
    switchScreen('word-entry')
  }

  function handleSubmitWords() {
    switchScreen('gameplay')
  }

  function handleQuit() {
    // No persistence (see decisions log) means quitting mid-game discards
    // the round for good — confirm rather than losing it to a misclick.
    if (window.confirm(copy.footer.quitConfirm)) {
      switchScreen('start')
    }
  }

  return (
    <main className="app">
      <div className="app__inner">
        {renderScreen(activeScreen,
          {
            source,
            config: gameConfig,
            onCommitConfig: handleSubmitConfig,
            onSubmitWords: handleSubmitWords,
            onNewGame: () => {
              resetSource()
              switchScreen('game-setup')
            }
          })}
      </div>
      <Footer showLogo={started} onQuit={handleQuit} />
    </main>
  )
}

export default App
