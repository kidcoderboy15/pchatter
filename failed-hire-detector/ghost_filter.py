import logging

from config import MIN_DESCRIPTION_LENGTH, MAX_IDENTICAL_ROLES, STAFFING_AGENCIES
from db import is_excluded

logger = logging.getLogger(__name__)


def should_exclude(conn, posting) -> str | None:
    """Return exclusion reason if posting should be excluded, else None."""
    company = posting["company"]
    description = posting["description"] or ""

    # 1. Check manual exclusion list
    if is_excluded(conn, company):
        return "exclusion_list"

    # 2. Staffing agency check
    company_lower = company.lower()
    for agency in STAFFING_AGENCIES:
        if agency in company_lower:
            return "staffing_agency"

    # 3. Vague/short description
    if len(description.strip()) < MIN_DESCRIPTION_LENGTH:
        return "vague_description"

    return None


def filter_mass_posters(conn, postings: list) -> set:
    """Return set of job_ids that should be excluded due to mass posting."""
    from collections import Counter

    company_title_counts = Counter()
    job_id_to_company_title = {}

    for p in postings:
        key = (p["company"].lower(), p["title"].lower())
        company_title_counts[key] += 1
        job_id_to_company_title[p["job_id"]] = key

    exclude_ids = set()
    mass_keys = {k for k, v in company_title_counts.items() if v >= MAX_IDENTICAL_ROLES}

    for job_id, key in job_id_to_company_title.items():
        if key in mass_keys:
            exclude_ids.add(job_id)
            logger.info("Mass poster excluded: %s - %s", key[0], key[1])

    return exclude_ids
