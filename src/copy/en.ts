// src/copy/en.ts
export const copy = {
  gameplay: {
    gotItButton: 'Got it!',
    round: {
      1: { instructions: 'Describe the prompt without saying it.', label: 'Taboo' },
      2: { instructions: 'Act out the prompt!', label: 'Charades' },
      3: { instructions: "Say a single-word clue that is not the prompt.", label: 'Password' }
    },
    roundCurtain: {
      beginButton: 'Begin',
      readyPrompt: (team: string) => `Ready, ${team}?`,
      roundLabel: (roundNumber: number) => `Round ${roundNumber}`,
    },
    roundLabel: (number: number, type: string) => `Round ${number} · ${type}`,
    scoreboard: {
      button: {
        continue: 'Continue',
        newGame: 'New game',
      },
      results: {
        final: (winners: string[]) => ((winners.length > 1) ? winners.join(", ") + " tied..." : `${winners[0]} wins! 🎉`),
        preliminary: (winners: string[]) => ((winners.length > 1) ? winners.join(", ") + " are tied." : `${winners[0]} is leading 👀`),
      },
      tableHeader: {
        round: (round: number) => `R${round}`,
        team: 'Team',
        total: 'Total'
      },
      title: (round: number) => (round < 3 ? 'Scores so far' : 'Final scores'),
    },
    skipButton: 'Skip',
    timeRemainingLabel: (formatted: string) => `Time remaining: ${formatted}`,
    title: 'Current turn',
    turnCurtain: {
      goButton: (roundEnded: boolean) => roundEnded ? 'Continue' : 'Go',
      readyPrompt: (team: string) => `Next player on ${team}, ready?`,
      resultLabel: (count: number) => `You got ${count} correct.`,
      roundOverLabel: (round: number) => `Round ${round} finished!`,
      turnOverLabel: 'Turn over!',
    },
    turnIndicator: (team: string) => `${team}'s turn`,
    wordsLeft: (count: number) => `${count} prompts left`,
  },
  gameSetup: {
    errors: {
      'duplicate-team-name': 'Team names must be unique.',
      'insufficient-players-per-team': 'Each team needs at least 2 players.',
      'invalid-configuration': 'Add at least one team and one player.',
      'invalid-team-name': 'Give every team a name.',
      'too-many-players': 'You have more players on teams than in total.',
      'unassigned-players': 'Put every player on a team to start.',
    },
    hideWordsDuringEntryLabel: 'Hide words during entry?',
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
  wordEntry: {
    addButton: 'Add prompt',
    counter: (count: number, total: number) => `${count} / ${total} prompts`,
    doneButton: 'Done',
    errors: {
      duplicate: 'Already in the bowl.',
      empty: 'Type something first — even a quip counts.',
      'not-enough-words': 'Please add more prompts.',
      'too-many-words': 'Too many prompts, please remove some.',
    },
    hiddenWords: 'Prompts are hidden until gameplay 🙈',
    placeholder: 'Enter something for your team to guess',
    removeLabel: 'Remove prompt',
    title: 'Toss in your prompts!',
  },
} as const

