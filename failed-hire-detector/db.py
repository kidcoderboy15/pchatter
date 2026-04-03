import sqlite3
import os
from config import DB_PATH


def get_connection() -> sqlite3.Connection:
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_connection()
    schema_path = os.path.join(os.path.dirname(__file__), "schema.sql")
    with open(schema_path) as f:
        conn.executescript(f.read())
    conn.close()


def upsert_posting(conn, posting: dict):
    """Insert a new posting or update an existing one. Returns 'new' or 'existing'."""
    row = conn.execute(
        "SELECT id, times_seen FROM postings WHERE job_id = ?",
        (posting["job_id"],),
    ).fetchone()

    if row is None:
        conn.execute(
            """INSERT INTO postings
               (job_id, company, title, location, description, salary_min, salary_max,
                source, source_url, first_seen, last_seen, times_seen)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)""",
            (
                posting["job_id"],
                posting["company"],
                posting["title"],
                posting.get("location", ""),
                posting.get("description", ""),
                posting.get("salary_min"),
                posting.get("salary_max"),
                posting.get("source", ""),
                posting.get("source_url", ""),
                posting["scrape_date"],
                posting["scrape_date"],
            ),
        )
        return "new"
    else:
        conn.execute(
            """UPDATE postings
               SET last_seen = ?, times_seen = times_seen + 1
               WHERE job_id = ?""",
            (posting["scrape_date"], posting["job_id"]),
        )
        return "existing"


def get_posting(conn, job_id: str):
    return conn.execute(
        "SELECT * FROM postings WHERE job_id = ?", (job_id,)
    ).fetchone()


def get_active_postings(conn, active_window_days: int):
    return conn.execute(
        """SELECT * FROM postings
           WHERE last_seen >= date('now', ? || ' days')
             AND status != 'excluded'""",
        (f"-{active_window_days}",),
    ).fetchall()


def get_all_job_ids(conn) -> set:
    rows = conn.execute("SELECT job_id FROM postings").fetchall()
    return {r["job_id"] for r in rows}


def get_last_scrape_log(conn, job_id: str):
    return conn.execute(
        """SELECT * FROM scrape_log
           WHERE job_id = ?
           ORDER BY scrape_date DESC LIMIT 1""",
        (job_id,),
    ).fetchone()


def insert_scrape_log(conn, entry: dict):
    conn.execute(
        """INSERT INTO scrape_log
           (job_id, scrape_date, description_hash, salary_min, salary_max,
            applicant_count, was_missing)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (
            entry["job_id"],
            entry["scrape_date"],
            entry["description_hash"],
            entry.get("salary_min"),
            entry.get("salary_max"),
            entry.get("applicant_count"),
            entry.get("was_missing", False),
        ),
    )


def update_posting_field(conn, job_id: str, field: str, value):
    allowed = {
        "description_changed", "salary_changed", "repost_count",
        "score", "status", "contacted", "contacted_date", "notes",
    }
    if field not in allowed:
        raise ValueError(f"Field {field} not allowed for update")
    conn.execute(
        f"UPDATE postings SET {field} = ? WHERE job_id = ?",
        (value, job_id),
    )


def increment_repost_count(conn, job_id: str):
    conn.execute(
        "UPDATE postings SET repost_count = repost_count + 1 WHERE job_id = ?",
        (job_id,),
    )


def is_excluded(conn, company: str) -> bool:
    row = conn.execute(
        "SELECT id FROM exclusions WHERE LOWER(company) = LOWER(?)",
        (company,),
    ).fetchone()
    return row is not None


def add_exclusion(conn, company: str, reason: str):
    conn.execute(
        "INSERT INTO exclusions (company, reason) VALUES (?, ?)",
        (company, reason),
    )
    conn.commit()


def get_hot_postings(conn, limit: int = 10):
    return conn.execute(
        """SELECT * FROM postings
           WHERE status = 'hot' AND contacted = 0
           ORDER BY score DESC
           LIMIT ?""",
        (limit,),
    ).fetchall()


def get_status_counts(conn):
    rows = conn.execute(
        """SELECT status, COUNT(*) as cnt FROM postings
           WHERE last_seen >= date('now', '-14 days')
             AND status != 'excluded'
           GROUP BY status"""
    ).fetchall()
    return {r["status"]: r["cnt"] for r in rows}
