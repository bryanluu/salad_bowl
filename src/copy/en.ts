// src/copy/en.ts
export const copy = {
  gameSetup: {
    addTeamButton: 'Add team',
    setupStatus: (assigned: number, total: number) => `${assigned} out of ${total} players assigned`,
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
    roundLabel: (number: number, type: string) => `Round ${number} · ${type}`,
    skipButton: 'Skip',
    title: 'Current turn',
    turnIndicator: (team: string) => `${team}'s turn`,
    wordsLeft: (count: number) => `${count} prompts left`,
  },
  wordEntry: {
    addButton: 'Add prompt',
    counter: (count: number) => `${count} / 20 prompts`,
    doneButton: 'Done',
    errors: {
      duplicate: 'Already in the bowl.',
      empty: 'Type something first — even a quip counts.',
    },
    placeholder: 'Enter something for your team to guess',
    removeLabel: 'Remove prompt',
    title: 'Toss in your prompts!',
  },
} as const
