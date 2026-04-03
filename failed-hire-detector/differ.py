import hashlib
import logging
from datetime import date

from db import (
    get_all_job_ids,
    get_last_scrape_log,
    get_posting,
    increment_repost_count,
    insert_scrape_log,
    update_posting_field,
    upsert_posting,
)

logger = logging.getLogger(__name__)


def description_hash(desc: str) -> str:
    return hashlib.md5(desc.encode()).hexdigest()


def diff_and_store(conn, scraped_postings: list[dict]):
    """Compare scraped postings against DB, detect signals, store history."""
    today = date.today().isoformat()
    seen_job_ids = set()
    stats = {"new": 0, "updated": 0, "desc_changed": 0, "salary_changed": 0, "reposted": 0}

    existing_ids = get_all_job_ids(conn)

    for posting in scraped_postings:
        job_id = posting["job_id"]
        seen_job_ids.add(job_id)
        desc_h = description_hash(posting.get("description", ""))

        result = upsert_posting(conn, posting)

        if result == "new":
            stats["new"] += 1
        else:
            stats["updated"] += 1

            # Check for description change
            last_log = get_last_scrape_log(conn, job_id)
            if last_log and last_log["description_hash"] and last_log["description_hash"] != desc_h:
                update_posting_field(conn, job_id, "description_changed", True)
                stats["desc_changed"] += 1
                logger.info("Description changed: %s", posting["company"])

            # Check for salary increase
            if last_log:
                old_min = last_log["salary_min"]
                old_max = last_log["salary_max"]
                new_min = posting.get("salary_min")
                new_max = posting.get("salary_max")

                if _salary_increased(old_min, new_min) or _salary_increased(old_max, new_max):
                    update_posting_field(conn, job_id, "salary_changed", True)
                    stats["salary_changed"] += 1
                    logger.info("Salary increased: %s", posting["company"])

        # Log this scrape
        insert_scrape_log(conn, {
            "job_id": job_id,
            "scrape_date": today,
            "description_hash": desc_h,
            "salary_min": posting.get("salary_min"),
            "salary_max": posting.get("salary_max"),
            "applicant_count": posting.get("applicant_count"),
            "was_missing": False,
        })

    # Detect reposts: postings in DB that were missing last scrape but appeared again
    _detect_reposts(conn, existing_ids, seen_job_ids, today, stats)

    conn.commit()
    logger.info(
        "Diff complete: %d new, %d updated, %d desc changed, %d salary changed, %d reposts",
        stats["new"], stats["updated"], stats["desc_changed"],
        stats["salary_changed"], stats["reposted"],
    )
    return stats


def _detect_reposts(conn, existing_ids: set, seen_today: set, today: str, stats: dict):
    """For postings that existed before but weren't seen today, mark missing.
    For postings that were missing last time but seen today, mark as repost."""
    # Mark missing postings
    missing_ids = existing_ids - seen_today
    for job_id in missing_ids:
        last_log = get_last_scrape_log(conn, job_id)
        if last_log and last_log["scrape_date"] != today:
            insert_scrape_log(conn, {
                "job_id": job_id,
                "scrape_date": today,
                "description_hash": last_log["description_hash"],
                "salary_min": last_log["salary_min"],
                "salary_max": last_log["salary_max"],
                "applicant_count": last_log["applicant_count"],
                "was_missing": True,
            })

    # Detect returned postings (repost signal)
    returned_ids = existing_ids & seen_today
    for job_id in returned_ids:
        last_log = get_last_scrape_log(conn, job_id)
        if last_log and last_log["was_missing"]:
            increment_repost_count(conn, job_id)
            stats["reposted"] += 1
            posting = get_posting(conn, job_id)
            if posting:
                logger.info("Repost detected: %s - %s", posting["company"], posting["title"])


def _salary_increased(old_val, new_val) -> bool:
    if old_val is None or new_val is None:
        return False
    try:
        return float(new_val) > float(old_val)
    except (ValueError, TypeError):
        return False
