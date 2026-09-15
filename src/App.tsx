import { useState } from 'react'
import WordEntryScreen from './components/WordEntryScreen'
import GameSetupScreen from './components/GameSetupScreen'
import GameplayScreen from './components/GameplayScreen'
import { LocalWordSource } from './wordSources/LocalWordSource'
import type {
  ScreenId,
  ScreenNavItem,
  GameConfig,
  WordSource,
} from './types'

const screens: ScreenNavItem[] = [
  { id: 'game-setup', label: 'Game setup' },
  { id: 'word-entry', label: 'Word entry' },
  { id: 'gameplay', label: 'Turn / gameplay' },
]

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
  timerSeconds: 60,
  wordsPerPlayer: 5,
  shuffleTeamOrder: true,
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('game-setup')
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig)
  const [source, setSource] = useState(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))

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

  return (
    <main className="app">
      <div className="app__inner">
        {/* Dev-only: lets every screen be previewed without real game
            state or routing wired up yet. Remove once navigation is
            driven by the actual game flow. */}
        <nav className="dev-nav" aria-label="Screen preview">
          {screens.map((screen) => (
            <button
              key={screen.id}
              type="button"
              className="dev-nav__button"
              aria-current={activeScreen === screen.id}
              onClick={() => setActiveScreen(screen.id)}
            >
              {screen.label}
            </button>
          ))}
        </nav>

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
    </main>
  )
}

export default App
