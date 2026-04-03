import hashlib
import logging
import time
from datetime import date

import pandas as pd
from jobspy import scrape_jobs

from config import SEARCHES

logger = logging.getLogger(__name__)


def make_job_id(company: str, title: str, location: str) -> str:
    raw = f"{company.strip().lower()}|{title.strip().lower()}|{(location or '').strip().lower()}"
    return hashlib.sha256(raw.encode()).hexdigest()[:16]


def run_scrape(search_term: str, location: str, distance: int) -> pd.DataFrame:
    kwargs = {
        "site_name": ["indeed", "linkedin", "zip_recruiter"],
        "search_term": search_term,
        "results_wanted": 50,
        "country_indeed": "USA",
    }
    if location:
        kwargs["location"] = location
    if distance and distance > 0:
        kwargs["distance"] = distance

    return scrape_jobs(**kwargs)


def scrape_all() -> list[dict]:
    """Run all configured searches and return deduplicated list of posting dicts."""
    all_jobs: dict[str, dict] = {}
    today = date.today().isoformat()

    for search in SEARCHES:
        logger.info("Scraping: %s in %s", search["term"], search.get("location", "anywhere"))
        try:
            df = run_scrape(search["term"], search.get("location", ""), search.get("distance", 0))
        except Exception:
            logger.exception("Failed to scrape: %s", search["term"])
            time.sleep(2)
            continue

        if df is None or df.empty:
            logger.info("  No results for %s", search["term"])
            continue

        logger.info("  Got %d results", len(df))

        for _, row in df.iterrows():
            company = str(row.get("company", "")).strip()
            title = str(row.get("title", "")).strip()
            location = str(row.get("location", "")).strip()

            if not company or not title:
                continue

            job_id = make_job_id(company, title, location)

            if job_id in all_jobs:
                continue

            all_jobs[job_id] = {
                "job_id": job_id,
                "company": company,
                "title": title,
                "location": location,
                "description": str(row.get("description", "")),
                "salary_min": _parse_salary(row.get("min_amount")),
                "salary_max": _parse_salary(row.get("max_amount")),
                "source": str(row.get("site", "")),
                "source_url": str(row.get("job_url", "")),
                "scrape_date": today,
            }

        time.sleep(3)  # polite delay between searches

    logger.info("Total unique postings scraped: %d", len(all_jobs))
    return list(all_jobs.values())


def _parse_salary(val) -> float | None:
    if val is None or pd.isna(val):
        return None
    try:
        return float(val)
    except (ValueError, TypeError):
        return None
