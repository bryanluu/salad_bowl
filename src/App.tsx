import { useState } from 'react'
import WordEntryScreen from './components/WordEntryScreen'
import GameSetupScreen from './components/GameSetupScreen'
import GameplayScreen from './components/GameplayScreen'
import ScoreboardScreen from './components/ScoreboardScreen'
import type { ScreenId, ScreenNavItem, GameConfig } from './types'

const screens: ScreenNavItem[] = [
  { id: 'word-entry', label: 'Word entry' },
  { id: 'game-setup', label: 'Game setup' },
  { id: 'gameplay', label: 'Turn / gameplay' },
  { id: 'scoreboard', label: 'Scoreboard' },
]

function renderScreen(screenId: ScreenId, config: GameConfig, updateConfig: (newConfig: GameConfig) => void) {
  switch (screenId) {
    case 'word-entry':
      return <WordEntryScreen config={config} />
    case 'game-setup':
      return <GameSetupScreen config={config} updateConfig={updateConfig} />
    case 'gameplay':
      return <GameplayScreen />
    case 'scoreboard':
      return <ScoreboardScreen />
  }
}

const defaultGameConfig: GameConfig = {
  totalWords: 20,
  totalPlayers: 4,
  minPlayers: 4
}

function App() {
  const [activeScreen, setActiveScreen] = useState<ScreenId>('word-entry')
  const [gameConfig, setGameConfig] = useState<GameConfig>(defaultGameConfig)

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

        {renderScreen(activeScreen, gameConfig, handleUpdateConfig)}
      </div>
    </main>
  )
}

export default App
