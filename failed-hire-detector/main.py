#!/usr/bin/env python3
"""Failed Hire Detector — Daily Pipeline

Scrape → Diff → Score → Notify
"""
import logging
import os
import sys
from datetime import datetime

from db import get_connection, init_db
from scraper import scrape_all
from differ import diff_and_store
from scorer import score_all
from notifier import send_daily_report
from config import ACTIVE_WINDOW_DAYS

# --- Logging setup ---
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(os.path.join(LOG_DIR, "detector.log")),
        logging.StreamHandler(sys.stdout),
    ],
)
logger = logging.getLogger("detector")


def main():
    start = datetime.now()
    logger.info("=" * 50)
    logger.info("Failed Hire Detector — run started at %s", start.isoformat())

    # Step 0: Initialize database
    logger.info("Step 0: Initializing database...")
    init_db()

    conn = get_connection()

    try:
        # Step 1: Scrape
        logger.info("Step 1: Scraping job postings...")
        postings = scrape_all()
        logger.info("Scraped %d unique postings", len(postings))

        if not postings:
            logger.warning("No postings found. Skipping diff/score/notify.")
            return

        # Step 2: Diff against history
        logger.info("Step 2: Diffing against history...")
        stats = diff_and_store(conn, postings)
        logger.info("Diff stats: %s", stats)

        # Step 3: Score
        logger.info("Step 3: Scoring postings...")
        score_all(conn, ACTIVE_WINDOW_DAYS)

        # Step 4: Notify
        logger.info("Step 4: Sending daily report...")
        send_daily_report(conn)

    finally:
        conn.close()

    elapsed = (datetime.now() - start).total_seconds()
    logger.info("Pipeline complete in %.1f seconds", elapsed)
    logger.info("=" * 50)


if __name__ == "__main__":
    main()
