# public/sounds/

Every file here is a silent 0.3-second placeholder stub (SB-50), generated
so the app has something valid to load and play — no missing-file errors,
just no audible sound yet.

Replace each file in place with real audio, keeping the same filename.
Nothing in the code needs to change — `src/sounds/sounds.ts` is the single
place these filenames are referenced, and it documents exactly which UI
moment each one is tied to.

| File            | Fires when...                                              |
|-----------------|--------------------------------------------------------------|
| `win.mp3`       | A word is marked correct during a turn                       |
| `skip.mp3`      | A word is skipped during a turn                               |
| `tick.mp3`      | Once per second while the turn timer counts down               |
| `buzzer.mp3`    | The turn timer reaches zero                                    |
| `celebrate.mp3` | The final scoreboard has a single winner                       |
| `tie.mp3`       | The final scoreboard ends in a tie                              |
| `tap.mp3`       | General action buttons (Play, Start game, Done, Begin, Go/Continue) |
| `quit.mp3`      | The footer's Quit button                                        |
| `toggle-on.mp3` | Sound is switched *on* in settings (no matching "off" sound)     |

A few things worth keeping in mind when you swap these in:

- Keep files short. `win`/`skip`/`tap`/`quit`/`toggle-on` are one-shot UI
  blips — under ~1s is plenty. `tick` plays every second the timer's
  running, so it needs to be short enough not to overlap itself.
- `celebrate`/`tie` only play once, at the very end of the game (not the
  between-round scoreboards), so these can be a bit more indulgent.
- mp3 is what's wired up (`new Audio(...)`), but any format Safari/Chrome
  both support works — .mp3 or .m4a are the safest bet for iOS Safari.
