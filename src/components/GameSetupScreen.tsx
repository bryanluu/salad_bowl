import { useState } from 'react'
import Stepper from './Stepper'
import { copy } from '../copy/en.ts'
import type { GameConfig, Team } from '../types.ts'

const minTeams = 2
const minPlayers = 4
const maxPlayers = 30
const minPlayersPerTeam = 2 // also caps max teams at ⌊totalPlayers / 2⌋, per ticket
const minTimerSeconds = 30
const maxTimerSeconds = 300
const timerStepSeconds = 15
const minWordsPerPlayer = 1
const maxWordsPerPlayer = 15

// TODO: should also be called every time totalPlayers changes below assignedPlayers
function splitPlayersEvenly(totalPlayers: number, teamCount: number, existingNames: string[]): Team[] {
  const base = Math.floor(totalPlayers / teamCount)
  const remainder = totalPlayers % teamCount
  return Array.from({ length: teamCount }, (_, i) => ({
    id: `team-${i + 1}`,
    name: existingNames[i] ?? `Team ${i + 1}`,
    players: base + (i < remainder ? 1 : 0),
  }))
}

function GameSetupScreen({ config, updateConfig }: { config: GameConfig, updateConfig: (gc: GameConfig) => void }) {
  const [newConfig, setNewConfig] = useState<GameConfig>({ ...config })

  const maxTeams = Math.floor(newConfig.totalPlayers / minPlayersPerTeam)
  const assignedPlayers = newConfig.teams.reduce((sum, t) => sum + t.players, 0)

  // Generic setter for any top-level GameConfig field.
  function editConfig<K extends keyof GameConfig>(field: K, value: GameConfig[K]) {
    setNewConfig(prev => ({ ...prev, [field]: value }))
  }

  // Generic setter for a field on a single team.
  function editTeam<K extends keyof Team>(teamId: string, field: K, value: Team[K]) {
    setNewConfig(prev => ({
      ...prev,
      teams: prev.teams.map(t => (t.id === teamId ? { ...t, [field]: value } : t)),
    }))
  }

  // Changing team count re-splits the roster, so it's not a plain field
  // set — it gets its own handler instead of going through editConfig.
  function setTeamCount(teamCount: number) {
    // TODO: implement split only when autosplit enabled (or when form is fresh)
    setNewConfig(prev => ({
      ...prev,
      teams: splitPlayersEvenly(prev.totalPlayers, teamCount, prev.teams.map(t => t.name)),
    }))
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    updateConfig(newConfig)
  }

  // Enter in a team name input would implicitly submit the form, but
  // Start is the only submit path, so swallow Enter in the inputs.
  function suppressEnter(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Enter') {
      event.preventDefault()
    }
  }

  return (
    <section className="screen" aria-labelledby="game-setup-title">
      <header className="screen__header">
        <h1 className="screen__title" id="game-setup-title">
          {copy.gameSetup.title}
        </h1>
      </header>

      <form className="screen__form" aria-label={copy.gameSetup.title} onSubmit={handleSubmit}>
        <div>
          <div className="field-row">
            <span className="field-row__label">{copy.gameSetup.totalPlayersLabel}</span>
            <Stepper
              label="total players"
              value={newConfig.totalPlayers}
              min={minPlayers}
              max={maxPlayers}
              onChange={(v) => editConfig('totalPlayers', v)}
            />
          </div>
          <p className="field-row__help">{copy.gameSetup.totalPlayersHelp(maxTeams, minPlayersPerTeam)}</p>
        </div>

        <div className="field-row">
          <span className="field-row__label">Number of teams</span>
          <Stepper
            label="number of teams"
            value={newConfig.teams.length}
            min={minTeams}
            max={maxTeams}
            onChange={setTeamCount}
          />
        </div>

        <p className="setup-status">{copy.gameSetup.setupStatus(assignedPlayers, newConfig.totalPlayers)}</p>

        <div className="teams">
          {newConfig.teams.map((team, index) => (
            <div className="team-row" key={team.id}>
              <input
                className="input"
                type="text"
                placeholder={copy.gameSetup.teamNamePlaceholder(index + 1)}
                value={team.name}
                onChange={(e) => editTeam(team.id, 'name', e.target.value)}
                onKeyDown={suppressEnter}
                required
              />
              <Stepper
                label={`team ${index + 1} players`}
                value={team.players}
                min={minPlayersPerTeam}
                // TODO: implement a dynamic max for players on each team
                onChange={(v) => editTeam(team.id, 'players', v)}
              />
            </div>
          ))
            // TODO: implement way to remove team
          }
        </div>

        <button
          className="btn btn--secondary"
          type="button"
          onClick={() => setTeamCount(newConfig.teams.length + 1)}
        >
          + {copy.gameSetup.addTeamButton}
        </button>

        <div className="field-row">
          <span className="field-row__label">{copy.gameSetup.timerLabel}</span>
          <Stepper
            label="timer"
            value={newConfig.timerSeconds}
            min={minTimerSeconds}
            max={maxTimerSeconds}
            step={timerStepSeconds}
            formatValue={(s) => `${s}s`}
            onChange={(v) => editConfig('timerSeconds', v)}
          />
        </div>

        <div className="field-row">
          <span className="field-row__label">{copy.gameSetup.wordsPerPlayerLabel}</span>
          <Stepper
            label="words per player"
            value={newConfig.wordsPerPlayer}
            min={minWordsPerPlayer}
            max={maxWordsPerPlayer}
            onChange={(v) => editConfig('wordsPerPlayer', v)}
          />
        </div>

        <button className="btn btn--primary" type="submit">
          {copy.gameSetup.startButton}
        </button>
      </form>
    </section>
  )
}

export default GameSetupScreen
