import logging
from datetime import date, datetime

from config import SCORE_HOT, SCORE_WARM
from db import get_active_postings, update_posting_field
from ghost_filter import filter_mass_posters, should_exclude

logger = logging.getLogger(__name__)


def score_all(conn, active_window_days: int = 14):
    """Recalculate scores for all active postings."""
    postings = get_active_postings(conn, active_window_days)
    post_dicts = [dict(p) for p in postings]

    mass_exclude_ids = filter_mass_posters(conn, post_dicts)

    scored = 0
    excluded = 0

    for p in postings:
        job_id = p["job_id"]

        # Check exclusions
        if job_id in mass_exclude_ids:
            update_posting_field(conn, job_id, "status", "excluded")
            excluded += 1
            continue

        reason = should_exclude(conn, p)
        if reason:
            update_posting_field(conn, job_id, "status", "excluded")
            excluded += 1
            logger.debug("Excluded %s: %s", p["company"], reason)
            continue

        score = calculate_score(p)
        update_posting_field(conn, job_id, "score", score)

        if score >= SCORE_HOT:
            status = "hot"
        elif score >= SCORE_WARM:
            status = "warm"
        else:
            status = "watch"

        update_posting_field(conn, job_id, "status", status)
        scored += 1

    conn.commit()
    logger.info("Scored %d postings, excluded %d", scored, excluded)


def calculate_score(posting) -> int:
    score = 0
    today = date.today()

    # Age score
    first_seen = _parse_date(posting["first_seen"])
    if first_seen:
        days_open = (today - first_seen).days

        if days_open >= 90:
            score += 40
        elif days_open >= 60:
            score += 30
        elif days_open >= 45:
            score += 20
        elif days_open >= 30:
            score += 10

    # Repost signals
    repost_count = posting["repost_count"] or 0
    score += min(repost_count * 12, 36)

    # Check if posting disappeared and returned (via repost_count > 0)
    if repost_count > 0:
        score += 15

    # Desperation signals
    if posting["description_changed"]:
        score += 10
    if posting["salary_changed"]:
        score += 15

    # Cap at 100
    return min(score, 100)


def _parse_date(val) -> date | None:
    if val is None:
        return None
    if isinstance(val, date):
        return val
    try:
        return datetime.strptime(str(val), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        return None
