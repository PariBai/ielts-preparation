# IELTS Prep Tracker

A personal IELTS preparation site: the full syllabus from `ielts.docx` as browsable
reference, plus day-by-day checkboxes, notes, and practice logs. Progress is stored
**on the server**, so it follows you between your PC and your phone through the tunnel.

## What's in it

Pick a module from the left menu. Each module has three tabs:

| Module | Syllabus tab | Second tab | Resources tab |
|---|---|---|---|
| ✍️ Writing | Task 1 (6 chart types, 4-paragraph structure) + Task 2 (5 essay types, 4-paragraph structure) | **21-Day Writing Syllabus** — 21 checkable day cards across 3 weeks | Grammarly, IELTS Liz |
| 🗣️ Speaking | The three parts of the interview | **10-Day Speaking Sprint** — 10 checkable day cards | IDP app, ELSA, HelloTalk |
| 🎧 Listening | The four recordings and what each contains | **Practice Log** — mock test scores /40 with band estimate | IELTS Online Tests |
| 📖 Reading | Passage format + the four question types | **Practice Log** — timed passage sets with band estimate | British Council |

Every day card expands to show the grammar concept, the IELTS task type, the daily
drill, and a notes box. Notes autosave ~0.7s after you stop typing.

The document has no day-by-day plan for Listening and Reading, so those two modules
get a session logger instead — date, what you did, score out of 40, minutes taken,
and what cost you marks. Best score and a rolling 5-test average appear above the list.

**Dashboard** shows overall progress, next unfinished day in each plan, and the
countdown to your target date.
**Settings & Backup** sets the start and target dates, shows the pace you need to
keep, and downloads/restores a JSON backup of everything.

## Run it with Docker

```bash
docker compose up -d --build
```

Then open **http://localhost:3200**

The container listens on 3000 internally but is published on host port **3200**,
because port 3000 on this machine is already used by another service. Change the
`ports:` line in `docker-compose.yml` if you want a different one.

Data lives in the named volume `ielts-data` mounted at `/data`, so
`docker compose down` and rebuilds never touch your progress. To wipe it
deliberately: `docker compose down -v`.

## Accounts

Accounts are declared in `.env` and never self-registered, because the app sits
behind a public tunnel:

```ini
USERS=pari:pariok678,ali:secret2,sara:secret3
SESSION_DAYS=30
```

Add or remove a name, then `docker compose up -d`. Removing a name also kills
that person's existing sessions.

**Each account is fully separate**: its own ticks, notes, practice logs, marked
essays, band history and exam date, stored at `/data/users/<name>.json`.
Nobody can see anyone else's progress.

**Generated lessons are shared** across accounts, in `/data/lessons.json`. A
lesson is generic teaching material, so once one person has paid to generate a
topic, everyone reads it free.

The single-user `AUTH_USERNAME` / `AUTH_PASSWORD` pair still works and is merged
into the account list. An existing `state.json` from before multi-user is
migrated automatically to the first configured account on startup.

How the login works:

- Passwords are never stored or compared in plaintext — each is scrypt-hashed at
  boot and compared with `crypto.timingSafeEqual`. An unknown username still
  costs a hash, so it cannot be told apart from a bad password by timing.
- Signing in sets an HttpOnly, SameSite=Lax cookie holding an HMAC-signed token.
  Tampering fails the signature check.
- The signing key lives at `/data/session.key`, so restarts do not sign you out.
- The cookie is marked `Secure` automatically over HTTPS.
- Failed logins are throttled to 10 per IP per 15 minutes.
- Every route except `/login.html`, `/healthz` and `/api/login` needs a session.

If no accounts are configured the server logs a loud warning and runs
**unprotected** — never expose it in that state.

## The AI tutor

Each day card has a **Learn this with AI** button running a four-stage flow:
lesson → quiz → timed writing → examiner report. Configure it in `.env`:

```ini
GEMINI_API_KEY=...          # or OPENAI_API_KEY=...
GEMINI_MODEL=gemini-3-flash-preview
```

The provider is auto-detected from whichever key is present.

- **Lesson** — full explanation, tables of forms, worked examples, IELTS
  relevance, common mistakes. **Cached server-side**, so reopening it is free
  and instant. "Rewrite this lesson" forces a paid regeneration.
- **Quiz** — mixed formats: multiple choice, gap fill, rewrite/transform, and
  find-the-error. MCQ and gap fills are marked in the browser; free-text answers
  go back to the model, which accepts any correct wording.
- **Write** — a task that forces the day's grammar, with a live countdown and
  word counter. Submit whenever you like; the clock never locks you out.
- **Report** — bands for all four criteria, every mistake quoted and corrected,
  and one instruction for next time. The marking prompt is explicitly told not
  to inflate.
- **Ask about this lesson** — follow-up questions with memory. The browser holds
  the conversation and replays it, capped at the last 12 turns, so the service
  stays stateless.

The four stage pills in the header are clickable: go back to the lesson mid-essay
and your draft and running clock are preserved.

Quizzes and writing tasks are deliberately NOT cached — repeating the same
questions would defeat the practice.

The tutor container publishes no port. It is reachable only from the app
container on the internal network, which requires a login first.

### Exposing it through a tunnel

The `tunnel` service runs a Cloudflare **quick tunnel**, which needs no
Cloudflare account and no domain. It comes up with the rest of the stack; the
login is what keeps other people out.

The catch is that the hostname is random and changes on **every restart** of the
tunnel container. To read the current one:

```bash
docker logs ielts-tunnel 2>&1 | grep trycloudflare
# https://some-random-words-here.trycloudflare.com
```

The URL can take up to a minute to appear after start. If the log instead shows

```
failed to request quick Tunnel: ... context deadline exceeded
```

that is normally Cloudflare rate-limiting quick-tunnel registration, not a
network fault. cloudflared retries every ~16s and usually gets through on its
own; leave it running.

To run local-only with no public exposure, just skip the service:

```bash
docker compose up -d ielts tutor   # http://localhost:3200
```

For a hostname that does *not* change, you need a named tunnel on a domain in
your own Cloudflare account — a token in `.env` and routing configured in the
Zero Trust dashboard rather than here.

## Run it without Docker

```bash
npm install
npm start                  # http://localhost:3000 — occupied here, so:
PORT=3200 npm start
DATA_DIR=/some/path npm start
```

## Mobile

The layout is built for the phone as a first-class target, verified under Chrome
device emulation at 390 × 844:

- Below 860px the sidebar becomes a slide-in drawer behind the ☰ button, with a
  tap-to-dismiss scrim and the background locked from scrolling.
- No page scrolls horizontally; wide content (the ASCII diagrams, long tables)
  scrolls inside its own container instead of pushing the page sideways.
- The module tab bar swaps to short labels and scrolls sideways rather than
  wrapping to two lines.
- Form controls are 16px on mobile, below which iOS Safari zooms the page on focus.
- Touch devices get larger hit areas for checkboxes, nav rows, and buttons, and
  hover styling is suppressed so it doesn't stick after a tap.
- `viewport-fit=cover` plus `env(safe-area-inset-*)` keeps the top bar clear of
  the notch and content clear of the home indicator.

Add it to your phone's home screen from the browser's share menu for an app-like
launcher.

## Data

Everything is one JSON file at `$DATA_DIR/state.json`:

```json
{
  "settings": { "startDate": "2026-08-24", "examDate": "2026-09-30" },
  "tasks":    { "w1": { "done": true, "completedAt": "..." } },
  "notes":    { "w1": { "text": "...", "updatedAt": "..." } },
  "sessions": { "reading": [ { "id": "...", "date": "...", "correct": 31, "max": 40 } ] }
}
```

Writes are atomic (temp file + rename) and serialised, so a crash mid-save cannot
truncate it. If the file is ever unreadable at startup it is copied to
`state.json.corrupt-<timestamp>` rather than silently discarded.

Day IDs are `w1`–`w21` (Writing) and `s1`–`s10` (Speaking).

### API

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/login` | `{ "username", "password" }` — sets the session cookie |
| `POST` | `/api/logout` | Clears the cookie |
| `GET` | `/api/me` | `{ authEnabled, loggedIn }` — public |
| `GET` | `/healthz` | Liveness, public |
| `GET` | `/api/state` | Everything |
| `PUT` | `/api/task/:id` | `{ "done": true \| false }` |
| `PUT` | `/api/note/:key` | `{ "text": "..." }` — empty text deletes the note |
| `PUT` | `/api/settings` | `{ "startDate", "examDate" }` |
| `POST` | `/api/session/:module` | `listening` or `reading` |
| `DELETE` | `/api/session/:module/:id` | Remove one session |
| `GET` | `/api/export` | Download backup |
| `POST` | `/api/import` | Replace all state |

## Editing the syllabus content

All curriculum text lives in [public/content.js](public/content.js) — plain data,
no build step. Add a day to a week's `days` array with a fresh `id`, or add a new
module to `MODULES` plus `MODULE_ORDER`. Reload the page and it appears; existing
ticks and notes are keyed by day `id`, so don't renumber ids you've already used.

## Layout

```
server.js            Express API + static host, per-user stores
auth.js              Accounts, signed session cookies, throttling
tutor/               Python FastAPI service calling Gemini or OpenAI
  main.py            Endpoints + provider adapters
  prompts.py         Lesson, quiz, task, marking and chat prompts
public/
  index.html         Shell
  content.js         All syllabus data from ielts.docx
  app.js             Router, rendering, sync
  login.html         Sign-in page (self-contained)
  tutor.js           The Learn flow overlay
  styles.css         Light + dark (follows your OS theme)
Dockerfile
docker-compose.yml
data/
  users/<name>.json  per-account progress
  lessons.json       shared lesson cache
  session.key        cookie signing key
.env                 USERS + API key (gitignored)
```
