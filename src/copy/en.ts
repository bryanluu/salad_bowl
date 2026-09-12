// src/copy/en.ts
export const copy = {
  gameSetup: {
    errors: {
      'duplicate-team-name': 'Team names must be unique.',
      'insufficient-players-per-team': 'Each team needs at least 2 players.',
      'invalid-configuration': 'Add at least one team and one player.',
      'invalid-team-name': 'Give every team a name.',
      'too-many-players': 'You have more players on teams than in total.',
      'unassigned-players': 'Put every player on a team to start.',
    },
    setupStatus: (assigned: number, total: number) => `${assigned} out of ${total} players assigned`,
    shuffleTeamOrderLabel: 'Random order?',
    startButton: 'Start game',
    teamNamePlaceholder: (teamNumber: number) => `Team ${teamNumber}'s name`,
    timerLabel: 'Timer',
    title: 'Game setup',
    totalPlayersHelp: (maxTeams: number, minPlayers: number) => `Up to ${maxTeams} teams · min ${minPlayers} players each`,
    totalPlayersLabel: 'Total players',
    wordsPerPlayerLabel: 'Prompts / player',
  },
  gameplay: {
    gotItButton: 'Got it!',
    round: {
      1: { label: 'Taboo', instructions: 'Describe the prompt without saying it.' },
      2: { label: 'Charades', instructions: 'Act out the prompt!' },
      3: { label: 'Password', instructions: "Say a single-word clue that is not the prompt." }
    },
    roundLabel: (number: number, type: string) => `Round ${number} · ${type}`,
    roundCurtain: {
      beginButton: 'Begin',
      readyPrompt: (team: string) => `Ready, ${team}?`,
      roundLabel: (roundNumber: number) => `Round ${roundNumber}`,
    },
    skipButton: 'Skip',
    timeRemainingLabel: (formatted: string) => `Time remaining: ${formatted}`,
    title: 'Current turn',
    turnCurtain: {
      goButton: 'Go',
      readyPrompt: (team: string) => `Next player on ${team}, ready?`,
      resultLabel: (count: number) => `You got ${count} correct.`,
      turnOverLabel: 'Turn over!',
      roundOverLabel: (round: number) => `Round ${round} finished!`,
    },
    turnIndicator: (team: string) => `${team}'s turn`,
    wordsLeft: (count: number) => `${count} prompts left`,
  },
  wordEntry: {
    addButton: 'Add prompt',
    counter: (count: number, total: number) => `${count} / ${total} prompts`,
    doneButton: 'Done',
    errors: {
      duplicate: 'Already in the bowl.',
      empty: 'Type something first — even a quip counts.',
      'too-many-words': 'Too many prompts, please remove some.',
      'not-enough-words': 'Please add more prompts.'
    },
    placeholder: 'Enter something for your team to guess',
    removeLabel: 'Remove prompt',
    title: 'Toss in your prompts!',
  },
  scoreboard: {
    tableHeader: {
      round: (round: number) => `R${round}`,
      team: 'Team',
      total: 'Total'
    },
    title: (round: number) => (round < 3 ? 'Scores so far' : 'Final scores'),
    button: {
      continue: 'Continue',
      playAgain: 'Play again'
    },
  }
} as const
