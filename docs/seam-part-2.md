## Data model sketch — rooms & words (milestone 3)

Nothing here is implemented; it's a sketch based on decisions already logged on the project page, translated into a rough shape so milestone 3 doesn't start from a blank page.

Confirmed constraints from planning:

- No realtime/websockets — host does a single fetch at game start, not continuous polling
- Word submission window is pre-round-1 only — no mid-game arrivals
- Per-room word limit is host-configurable but enforced server-side (client-side limits are UX-only, since the submission endpoint is public)
- Backend/datastore choice (Firebase, Supabase, or similar) is explicitly not yet made — deferred to Vietnam

Rough shapes:

\`\`\`ts
interface Room {
  id: string          // join/room code
  createdAt: number
  wordLimit: number   // host-configured, server-enforced
  locked: boolean      // true once round 1 starts; blocks further submissions
}

interface WordSubmission {
  roomId: string
  word: string
  submittedAt: number
}
\`\`\`

A `RemoteWordSource` implementing today's `WordSource` interface would then:

- take a `roomId` at construction
- `getWords()` perform (or return the result of) the one host-side fetch, pulling all `WordSubmission`s for that room
- `addWord`/`removeWord` are either unused (submissions come from the public form, not the host) or repurposed for host-side moderation (removing a submitted word before the round starts) — not decided, see open questions

Interaction sketch:

1. Host creates a room → gets a room code / QR code pointing at the public submission form
2. Players scan/visit the link, submit words against `roomId` (server enforces `wordLimit` and rejects submissions once `locked`)
3. Host starts the game → `RemoteWordSource.getWords()` does its one fetch → `locked` flips true server-side
4. From here, gameplay is identical to the local flow — `GameplayScreen` doesn't know or care which `WordSource` it got

## What's left for milestone 3

Nothing below has tickets yet — this is the "what's left" list the DoD asks for, derived from the project page's implementation plan and decisions log, not from an existing backlog.

- **Pick a backend/datastore.** Options considered so far: Firebase, Supabase, "or similar" — no decision made. This blocks everything else.
- **Room/join-code generation.** Format and uniqueness strategy undecided (see open questions).
- **QR code generation** for the submission link — likely a client-side lib pointed at a room-scoped URL; no research done yet.
- **Public word-submission form.** A minimal, unauthenticated web form scoped to a `roomId`.
- **Server-side enforcement**, since the submission endpoint is public and client checks are UX-only:
  - per-room word limit
  - submission window (reject once room is `locked`)
- **`RemoteWordSource` implementation** conforming to the existing `WordSource` interface (see sketch above), including the single host-side fetch at game start.
- **Room lifecycle / cleanup.** Not discussed yet — do rooms expire, get deleted after the game, or persist? (see open questions)
- **Wiring into `App.tsx`.** Today `App` always constructs a `LocalWordSource`; it'll need a path to construct a `RemoteWordSource` instead (room creation/join flow, likely a new pre-`game-setup` screen).

## Open questions

- **Backend/datastore choice** — Firebase vs. Supabase vs. other; gates most of the rest.
- **Room code format** — length, character set, collision handling.
- **`addWord`/`removeWord` on `RemoteWordSource`** — meaningless passthroughs, host-side moderation, or omitted (which would mean loosening the interface or accepting a partial implementation)?
- **Room lifecycle** — TTL/expiry, manual cleanup, or unbounded growth (fine at personal scale, but worth deciding on purpose)?
- **Abuse handling on the public endpoint** — beyond the server-enforced word limit, is rate-limiting or validation needed, or is personal-scale usage low-risk enough to skip this?

## Non-goals (milestone 3)

Carried over from the project page, restated here so they don't get silently re-litigated in Vietnam:

- Full realtime multiplayer / live lobby state sync
- Mid-game word submission
- SMS/Twilio as a submission channel

## Alternatives considered (already decided, logged for context)

- **SMS/Twilio for submission** — rejected: needs a provisioned number and A2P 10DLC registration; a QR/link gets ~95% of the benefit at a fraction of the complexity.
- **Full realtime sync** — rejected: adds ~25–45h for lobby/live-state sync; async submission gets most of the "own phone" benefit without that cost.
- **Continuous host polling** — rejected in favor of a single fetch at game start, since submissions are pre-round-1 only anyway.
