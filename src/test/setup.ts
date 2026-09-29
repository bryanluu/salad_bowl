// src/test/setup.ts
import '@testing-library/jest-dom/vitest'

// jsdom doesn't implement media playback: play() and pause() log "Not
// implemented" to the console on every call (and play() returns undefined
// instead of a Promise). Component tests render through the real
// SoundProvider, so any gesture in a test — even a simulated press that
// bubbles up to window — trips its unlock/priming pass, and unmounting
// pauses every element. Make both inert, and give play() the Promise a real
// browser returns. Assigned directly rather than with vi.spyOn on purpose:
// suites that call vi.restoreAllMocks() would otherwise restore jsdom's
// noisy originals mid-run. Tests that assert on playback don't rely on
// this — they replace `Audio` wholesale with vi.stubGlobal.
window.HTMLMediaElement.prototype.play = () => Promise.resolve()
window.HTMLMediaElement.prototype.pause = () => { }
