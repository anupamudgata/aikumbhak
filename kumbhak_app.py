#!/usr/bin/env python3
import time
import sys
import argparse

# Default session: rounds 1-5 hold 30s, rounds 6-10 hold 45s.
DEFAULT_HOLDS = [30, 30, 30, 30, 30, 45, 45, 45, 45, 45]

BLUE = "\033[94m"
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"
CLEAR = "\033[2J\033[H"


def beep():
    sys.stdout.write("\a")
    sys.stdout.flush()


def progress_bar(current, total, width=30):
    filled = int(width * current / total)
    bar = "█" * filled + "░" * (width - filled)
    return bar


def summarize_holds(holds):
    """Compact description of the hold schedule, e.g. [30,30,45] -> '30s×2, 45s'."""
    parts = []
    i = 0
    while i < len(holds):
        j = i
        while j < len(holds) and holds[j] == holds[i]:
            j += 1
        count = j - i
        parts.append(f"{holds[i]}s×{count}" if count > 1 else f"{holds[i]}s")
        i = j
    return ", ".join(parts)


def render(round_num, holds, phase, phase_color, time_left, total_time, rounds_done):
    total_rounds = len(holds)
    out = []
    out.append(CLEAR)
    out.append(f"{BOLD}{CYAN}╔══════════════════════════════════════════╗{RESET}")
    out.append(f"{BOLD}{CYAN}║        🧘  KUMBHAK BREATH TIMER  🧘      ║{RESET}")
    out.append(f"{BOLD}{CYAN}╚══════════════════════════════════════════╝{RESET}")
    out.append("")

    # Round info
    if round_num > 0:
        hold_dur = holds[round_num - 1]
        out.append(f"  {BOLD}Round {round_num} / {total_rounds}{RESET}   {DIM}(Hold: {hold_dur}s){RESET}")
    else:
        plural = "s" if total_rounds != 1 else ""
        out.append(f"  {DIM}{total_rounds} round{plural}  |  holds: {summarize_holds(holds)}{RESET}")
    out.append("")

    # Round indicators
    indicators = []
    for i in range(1, total_rounds + 1):
        if i < round_num or i in rounds_done:
            indicators.append(f"{GREEN}●{RESET}")
        elif i == round_num:
            indicators.append(f"{YELLOW}◉{RESET}")
        else:
            indicators.append(f"{DIM}○{RESET}")
    out.append("  Rounds: " + " ".join(indicators))
    out.append("")

    # Phase display
    out.append(f"  {BOLD}{phase_color}┌────────────────────────────────────────┐{RESET}")
    phase_text = f"{phase}"
    padding = (40 - len(phase)) // 2
    out.append(f"  {BOLD}{phase_color}│{' ' * padding}{phase_text}{' ' * (40 - padding - len(phase))}│{RESET}")
    out.append(f"  {BOLD}{phase_color}└────────────────────────────────────────┘{RESET}")
    out.append("")

    # Timer
    mins = time_left // 60
    secs = time_left % 60
    timer_str = f"{mins:01d}:{secs:02d}" if mins > 0 else f"{secs:02d}"
    timer_padding = (44 - len(timer_str) * 2) // 2
    out.append(f"{' ' * timer_padding}{BOLD}{phase_color}{timer_str}{RESET}")
    out.append("")

    # Progress bar
    if total_time > 0:
        elapsed = total_time - time_left
        bar = progress_bar(elapsed, total_time)
        pct = int(100 * elapsed / total_time)
        out.append(f"  {phase_color}{bar}{RESET} {pct}%")
    out.append("")

    # Instructions
    out.append(f"  {DIM}Press Ctrl+C to stop{RESET}")

    sys.stdout.write("\n".join(out) + "\n")
    sys.stdout.flush()


def countdown(round_num, holds, phase, phase_color, duration, rounds_done):
    for remaining in range(duration, 0, -1):
        render(round_num, holds, phase, phase_color, remaining, duration, rounds_done)
        time.sleep(1)
    render(round_num, holds, phase, phase_color, 0, duration, rounds_done)


def run_session(holds):
    total_rounds = len(holds)
    rounds_done = set()

    render(0, holds, "GET READY", GREEN, 0, 0, rounds_done)
    print(f"\n  {BOLD}{GREEN}Starting in 5 seconds...{RESET}")
    time.sleep(5)

    for i, hold_duration in enumerate(holds):
        round_num = i + 1

        # BREATHE IN (4 seconds)
        beep()
        countdown(round_num, holds, "BREATHE IN  ↑", BLUE, 4, rounds_done)

        # HOLD BREATH
        beep()
        beep()
        countdown(round_num, holds, f"HOLD BREATH  ■  ({hold_duration}s)", RED, hold_duration, rounds_done)

        # BREATHE OUT (6 seconds)
        beep()
        countdown(round_num, holds, "BREATHE OUT  ↓", YELLOW, 6, rounds_done)

        rounds_done.add(round_num)

        # Rest between rounds
        if i < total_rounds - 1:
            countdown(round_num, holds, "REST  ~", GREEN, 5, rounds_done)

    # Session complete
    render(total_rounds, holds, "SESSION COMPLETE ✓", GREEN, 0, 0, rounds_done)
    beep()
    beep()
    beep()
    plural = "s" if total_rounds != 1 else ""
    print(f"\n  {BOLD}{GREEN}All {total_rounds} round{plural} done! Great job! 🎉{RESET}")
    print(f"  {DIM}Total hold time: {sum(holds)}s  ({summarize_holds(holds)}){RESET}\n")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Kumbhak (breath-hold) timer with a live terminal UI.",
        epilog=(
            "examples:\n"
            "  %(prog)s                       default: 30s×5, then 45s×5\n"
            "  %(prog)s --rounds 8 --hold 40  8 rounds, 40s hold each\n"
            "  %(prog)s --holds 20 30 40 50   4 rounds with these exact holds\n"
        ),
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--holds", type=int, nargs="+", metavar="SEC",
                        help="explicit hold time (s) for each round; round count = values given")
    parser.add_argument("--rounds", type=int, metavar="N",
                        help="number of rounds (use with --hold for a uniform session; default 10)")
    parser.add_argument("--hold", type=int, metavar="SEC",
                        help="uniform hold time (s) for every round (default 30)")
    return parser.parse_args()


def build_holds(args):
    if args.holds is not None:
        if args.rounds is not None or args.hold is not None:
            sys.exit(f"{RED}Error: use either --holds OR --rounds/--hold, not both.{RESET}")
        holds = args.holds
    elif args.rounds is not None or args.hold is not None:
        rounds = args.rounds if args.rounds is not None else 10
        hold = args.hold if args.hold is not None else 30
        holds = [hold] * rounds if rounds > 0 else []
    else:
        holds = list(DEFAULT_HOLDS)

    if len(holds) == 0:
        sys.exit(f"{RED}Error: need at least one round.{RESET}")
    if any(h <= 0 for h in holds):
        sys.exit(f"{RED}Error: hold times must be positive (got {holds}).{RESET}")
    return holds


if __name__ == "__main__":
    holds = build_holds(parse_args())
    try:
        run_session(holds)
    except KeyboardInterrupt:
        print(f"\n\n  {YELLOW}Session stopped. Namaste! 🙏{RESET}\n")
        sys.exit(0)
