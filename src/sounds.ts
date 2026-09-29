// src/sounds.ts
import { assetUrl } from './assets.ts'

// Swap any file in public/sounds/ for a different sound — the names here
// are the contract, nothing else needs to change. A play() that fails
// (missing/broken file, or the browser blocking autoplay) no-ops with a
// console warning per failed attempt that names the actual cause (see
// src/hooks/useSoundEffects.tsx). Where each sound is called:
//
//   tap         generic action buttons — Start "Play", Setup "Start game",
//               WordEntry "Done", RoundIntroCurtain "Begin", TurnCurtain
//               "Go", scoreboard "Continue" / "New game" — and the mute
//               toggle's "on" confirmation blip
//   quit        the footer quit button, after the confirm dialog is
//               accepted (deliberately distinct, lower-key)
//   win         a word is won               — GameplayScreen.winWord
//   skip        a word is skipped           — GameplayScreen.skipWord
//   tick        a beat at the start of every turn (startTurn/startRound),
//               then once per second while a turn is live (see
//               TICK_LAST_N_SECONDS in GameplayScreen)
//   buzzer      the turn timer expires      — GameplayScreen.handleTimerExpiry
//   celebration final scoreboard appears, one winner — ScoreboardScreen
//   tie         final scoreboard appears, a tie      — ScoreboardScreen
//   round       round-complete sting, every round including the last —
//               GameplayScreen.endRound, the moment the last card of the
//               round is won
export const sounds = {
  tap: assetUrl('sounds/tap.mp3'),
  quit: assetUrl('sounds/quit.mp3'),
  win: assetUrl('sounds/win.mp3'),
  skip: assetUrl('sounds/skip.mp3'),
  tick: assetUrl('sounds/tick.mp3'),
  buzzer: assetUrl('sounds/buzzer.mp3'),
  celebration: assetUrl('sounds/celebration.mp3'),
  tie: assetUrl('sounds/tie.mp3'),
  round: assetUrl('sounds/round.mp3'),
} as const

export type SoundName = keyof typeof sounds
