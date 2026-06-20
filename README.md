# 🧘 Kumbhak Breath Timer

A timer for Kumbhak (breath-hold) breathing practice. It walks you through rounds
of **Breathe In → Hold → Breathe Out → Rest** with audible cues at each phase.

There are two ways to run it:

- **`index.html`** — a polished web app (recommended): a multi-technique breathing
  studio. Works on desktop and phone, no install.
- **`kumbhak_app.py`** — the original terminal version (Kumbhak hold only).

## Web app (recommended)

Just open the file in any browser:

```bash
open index.html        # macOS
xdg-open index.html    # Linux
```

To use it on your phone, copy `index.html` over (or serve the folder with
`python3 -m http.server` and open `http://<your-computer-ip>:8000` on the same Wi-Fi).

### Breathing techniques

Pick from a library on the home screen — each runs a generalized
**Inhale → Hold → Exhale → Hold → Rest** cycle (phases with a 0 duration are skipped):

| Technique     | Pattern (s)      | Use |
|---------------|------------------|-----|
| Box Breathing | 4-4-4-4          | Calm focus |
| 4-7-8 Relax   | 4-7-8            | Wind down / sleep |
| Coherent      | 5.5-5.5          | Balance / HRV |
| Calm 4-6      | 4-6              | Relax (long exhale) |
| Energize      | 2-2              | Quick wake-up |
| Kumbhak Hold  | 4-(hold)-6, rest | Breath retention — **customizable** |

Selecting **Kumbhak Hold** reveals sliders for rounds, inhale, hold, and exhale.

### During a session

- **Animated orb** expands on the inhale, holds, and contracts on the exhale,
  color-coded per phase, with round dots and a progress bar.
- **Pause / Resume** (button or **Spacebar**), **Restart**, **Exit** (or **Esc**).
- **Sound cues** — a distinct tone per phase. **Voice guidance** (toggle) speaks
  "Breathe in / Hold / Breathe out" using the browser's speech synthesis.
- Screen is kept awake during a session where supported.

### Progress tracking

The home screen shows **total sessions, total minutes, and a day streak**, saved
locally in your browser (`localStorage`) — nothing leaves your device.

## Terminal version

### Requirements

- Python 3.6+ (standard library only — nothing to install)

### Usage

```bash
python3 kumbhak_app.py        # run a session
./kumbhak_app.py              # if marked executable (chmod +x)
```

Press **Ctrl+C** anytime to stop.

### Default session

10 rounds: a 30s hold ×5, then a 45s hold ×5. Each round is
Breathe In (4s) → Hold → Breathe Out (6s) → Rest (5s between rounds).

### Configuring hold times

| Goal | Command |
|------|---------|
| Default (30s×5, then 45s×5) | `python3 kumbhak_app.py` |
| 8 rounds, 40s hold each | `python3 kumbhak_app.py --rounds 8 --hold 40` |
| 10 rounds, 25s hold each | `python3 kumbhak_app.py --hold 25` |
| Exact per-round holds | `python3 kumbhak_app.py --holds 20 30 40 50` |

- `--holds A B C ...` — explicit hold (seconds) for each round; the number of
  rounds equals the number of values given.
- `--rounds N` — number of rounds (default 10; use together with `--hold`).
- `--hold S` — uniform hold (seconds) for every round (default 30).

`--holds` cannot be combined with `--rounds` / `--hold`.

Run `python3 kumbhak_app.py --help` for the full reference.
