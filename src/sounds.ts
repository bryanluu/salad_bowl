// src/sounds.ts
import { assetUrl } from './assets.ts'

// TODO(SB-50): every value below is a stub path — no audio files exist yet.
// Drop the real files into public/sounds/ under exactly these names and the
// game picks them up; until then each sound no-ops with a one-time console
// warning (see src/hooks/useSoundEffects.tsx). Where each sound is called:
//
//   tap         generic action buttons — Start "Play", Setup "Start game",
//               WordEntry "Add prompt" / "Generate prompt" / "Done",
//               RoundIntroCurtain "Begin", TurnCurtain "Go", scoreboard
//               "Continue" / "New game" — and the mute toggle's "on"
//               confirmation blip
//   quit        the footer quit button (deliberately distinct, lower-key)
//   win         a word is won               — GameplayScreen.winWord
//   skip        a word is skipped           — GameplayScreen.skipWord
//   tick        urgency tick, final seconds — GameplayScreen (see
//               URGENT_TICK_SECONDS), once per second while a turn is live
//   buzzer      the turn timer expires      — GameplayScreen.handleTimerExpiry
//   celebration final scoreboard, one winner — ScoreboardScreen on mount
//   tie         final scoreboard, a tie     — ScoreboardScreen on mount
//   round       round-complete sting (rounds 1–2) — ScoreboardScreen on mount
export const sounds = {
  // TODO(SB-50): add public/sounds/tap.mp3
  tap: assetUrl('sounds/tap.mp3'),
  // TODO(SB-50): add public/sounds/quit.mp3
  quit: assetUrl('sounds/quit.mp3'),
  // TODO(SB-50): add public/sounds/win.mp3
  win: assetUrl('sounds/win.mp3'),
  // TODO(SB-50): add public/sounds/skip.mp3
  skip: assetUrl('sounds/skip.mp3'),
  // TODO(SB-50): add public/sounds/tick.mp3
  tick: assetUrl('sounds/tick.mp3'),
  // TODO(SB-50): add public/sounds/buzzer.mp3
  buzzer: assetUrl('sounds/buzzer.mp3'),
  // TODO(SB-50): add public/sounds/celebration.mp3
  celebration: assetUrl('sounds/celebration.mp3'),
  // TODO(SB-50): add public/sounds/tie.mp3
  tie: assetUrl('sounds/tie.mp3'),
  // TODO(SB-50): add public/sounds/round.mp3
  round: assetUrl('sounds/round.mp3'),
} as const

export type SoundName = keyof typeof sounds
