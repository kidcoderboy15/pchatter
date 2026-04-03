import json
import logging
from datetime import date, datetime
from urllib.request import Request, urlopen
from urllib.error import URLError

from config import SLACK_WEBHOOK_URL, TOP_N_NOTIFY
from db import get_hot_postings, get_status_counts

logger = logging.getLogger(__name__)


def send_daily_report(conn):
    """Build and send the daily Slack report."""
    if not SLACK_WEBHOOK_URL:
        logger.warning("SLACK_WEBHOOK_URL not configured, skipping notification")
        return

    hot_postings = get_hot_postings(conn, TOP_N_NOTIFY)
    counts = get_status_counts(conn)
    today_str = date.today().strftime("%B %-d, %Y")

    if not hot_postings:
        message = _build_no_targets_message(today_str, counts)
    else:
        message = _build_report_message(today_str, hot_postings, counts)

    _post_to_slack(message)


def _build_report_message(today_str: str, postings, counts: dict) -> str:
    lines = [
        f":red_circle: *FAILED HIRE DETECTOR -- {today_str}*",
        f"{len(postings)} companies that tried to hire and failed. They need you.",
        "",
        "\u2501" * 30,
        "",
    ]

    for p in postings:
        days_open = _days_open(p["first_seen"])
        signals = _build_signals(p)

        lines.append(f"*{p['score']}* :red_circle: *{p['company']}*")
        lines.append(f"{p['title']} \u00b7 {p['location'] or 'Remote'}")
        lines.append(f"{days_open} days open{signals}")

        if p["source_url"]:
            lines.append(f":link: <{p['source_url']}|View Posting>")
        lines.append("")

    lines.append("\u2501" * 30)
    lines.append("")

    warm = counts.get("warm", 0)
    watch = counts.get("watch", 0)
    total = sum(counts.values())
    lines.append(f"WARMING (50-79): {warm} targets tracked")
    lines.append(f"WATCHING: {watch} targets tracked")
    lines.append(f"Total pipeline: {total} active postings")

    return "\n".join(lines)


def _build_no_targets_message(today_str: str, counts: dict) -> str:
    total = sum(counts.values())
    warm = counts.get("warm", 0)
    watch = counts.get("watch", 0)
    return (
        f":white_circle: *FAILED HIRE DETECTOR -- {today_str}*\n"
        f"No hot targets today.\n\n"
        f"WARMING: {warm} | WATCHING: {watch} | Total: {total}"
    )


def _build_signals(posting) -> str:
    parts = []
    repost_count = posting["repost_count"] or 0
    if repost_count > 0:
        parts.append(f"Reposted {repost_count}x")
    if posting["salary_changed"]:
        parts.append("Salary increased")
    if posting["description_changed"]:
        parts.append("Description changed")
    if parts:
        return " \u00b7 " + " \u00b7 ".join(parts)
    return ""


def _days_open(first_seen_str) -> int:
    try:
        first = datetime.strptime(str(first_seen_str), "%Y-%m-%d").date()
        return (date.today() - first).days
    except (ValueError, TypeError):
        return 0


def _post_to_slack(text: str):
    payload = json.dumps({"text": text}).encode("utf-8")
    req = Request(
        SLACK_WEBHOOK_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urlopen(req, timeout=10) as resp:
            logger.info("Slack notification sent: %s", resp.status)
    except URLError:
        logger.exception("Failed to send Slack notification")
