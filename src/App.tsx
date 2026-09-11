import { useState } from 'react'
import WordEntryScreen from './components/WordEntryScreen'
import GameSetupScreen from './components/GameSetupScreen'
import GameplayScreen from './components/GameplayScreen'
import ScoreboardScreen from './components/ScoreboardScreen'
import { LocalWordSource } from './wordSources/LocalWordSource'
import type { ScreenId, ScreenNavItem, GameConfig, WordSource } from './types'

const screens: ScreenNavItem[] = [
  { id: 'game-setup', label: 'Game setup' },
  { id: 'word-entry', label: 'Word entry' },
  { id: 'gameplay', label: 'Turn / gameplay' },
  { id: 'scoreboard', label: 'Scoreboard' },
]

type ScreenProps = {
  source: WordSource
  config: GameConfig
  updateConfig: (newConfig: GameConfig) => void
}

function renderScreen(screenId: ScreenId, { source, config, updateConfig }: ScreenProps) {
  switch (screenId) {
    case 'game-setup':
      return <GameSetupScreen config={config} updateConfig={updateConfig} />
    case 'word-entry':
      return <WordEntryScreen config={config} source={source} />
    case 'gameplay':
      return <GameplayScreen config={config} source={source} />
    case 'scoreboard':
      return <ScoreboardScreen />
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
  const [source] = useState(() => new LocalWordSource(gameConfig.totalPlayers * gameConfig.wordsPerPlayer))

  function handleUpdateConfig(newConfig: GameConfig) {
    setGameConfig(newConfig)
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

        {renderScreen(activeScreen, { source, config: gameConfig, updateConfig: handleUpdateConfig })}
      </div>
    </main>
  )
}

export default App
