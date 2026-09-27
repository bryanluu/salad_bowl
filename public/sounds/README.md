# public/sounds/

Empty for now (SB-50). Each sound effect the game plays is tied to a
filename expected here — see the `TODO` comment above each entry in
`src/sounds/sounds.ts` for the full list and what triggers it.

Add a file with the exact name `sounds.ts` expects (e.g. `win.mp3`) and it
starts playing automatically — nothing else needs to change.

Until then, a missing sound isn't silent-and-invisible: `useSoundEffects.ts`
logs a `console.warn` the first time each one fails to play, naming the
sound and pointing back at its TODO, so it's obvious in dev which ones
still need audio.

| File            | Fires when...                                                        |
|-----------------|-----------------------------------------------------------------------|
| `win.mp3`       | A word is marked correct during a turn                                |
| `skip.mp3`      | A word is skipped during a turn                                       |
| `tick.mp3`      | Once per second while the turn timer counts down                      |
| `buzzer.mp3`    | The turn timer reaches zero                                           |
| `celebrate.mp3` | The final scoreboard has a single winner                              |
| `tie.mp3`       | The final scoreboard ends in a tie                                    |
| `tap.mp3`       | General action buttons (Play, Start game, Done, Begin, Go/Continue)   |
| `quit.mp3`      | The footer's Quit button                                              |
| `toggle-on.mp3` | Sound is switched *on* in settings (no matching "off" sound)          |

A few things worth keeping in mind when adding these:

- Keep files short. `win`/`skip`/`tap`/`quit`/`toggle-on` are one-shot UI
  blips — under ~1s is plenty. `tick` plays every second the timer's
  running, so it needs to be short enough not to overlap itself.
- `celebrate`/`tie` only play once, at the very end of the game (not the
  between-round scoreboards), so these can be a bit more indulgent.
- mp3 is what's wired up (`new Audio(...)`), but any format Safari/Chrome
  both support works — .mp3 or .m4a are the safest bet for iOS Safari.
