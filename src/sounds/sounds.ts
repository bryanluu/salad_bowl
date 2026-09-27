// src/sounds/sounds.ts
import { assetUrl } from '../assets.ts'

// Central map of every sound effect the game can play, keyed by a semantic
// name rather than a filename — mirrors copy/en.ts's separation of "what"
// gets said from "how it's expressed". Swap the file referenced here (see
// public/sounds/README.md) to change a sound without touching any call site.
//
// SB-50: every file here is a silent placeholder stub — replace the .mp3
// files in public/sounds/ with real audio. Nothing else needs to change.
export const sounds = {
  // A word is marked correct during a turn (TurnScreen's swipe-right /
  // "Got it!" button, via GameplayScreen.winWord).
  win: assetUrl('sounds/win.mp3'),
  // A word is skipped during a turn (TurnScreen's swipe-left / "Skip"
  // button, via GameplayScreen.skipWord).
  skip: assetUrl('sounds/skip.mp3'),
  // Once per second while the turn timer counts down (TurnScreen).
  tick: assetUrl('sounds/tick.mp3'),
  // The turn timer reaches zero (GameplayScreen.handleTimerExpiry).
  buzzer: assetUrl('sounds/buzzer.mp3'),
  // The final scoreboard (game end, not a between-round scoreboard) has a
  // single winner (ScoreboardScreen).
  celebrate: assetUrl('sounds/celebrate.mp3'),
  // The final scoreboard ends in a tie (ScoreboardScreen).
  tie: assetUrl('sounds/tie.mp3'),
  // General action buttons: Play, Start game, Done, Begin, Go/Continue.
  // Deliberately NOT wired into config micro-interactions (word add/
  // remove/generate, stepper +/-) — see WordEntryScreen for why.
  tap: assetUrl('sounds/tap.mp3'),
  // The footer's Quit button — deliberately distinct from `tap` since it's
  // a destructive/exit action, not a forward-progress one.
  quit: assetUrl('sounds/quit.mp3'),
  // Confirmation blip when sound is switched *on* in settings. There's no
  // corresponding "off" sound — playing a sound to announce sound is now
  // off would be self-defeating.
  toggleOn: assetUrl('sounds/toggle-on.mp3'),
} as const

export type SoundName = keyof typeof sounds
