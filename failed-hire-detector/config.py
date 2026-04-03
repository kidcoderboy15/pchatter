import os

# --- Slack ---
SLACK_WEBHOOK_URL = os.environ.get("SLACK_WEBHOOK_URL", "")

# --- Database ---
DB_PATH = os.path.join(os.path.dirname(__file__), "data", "detector.db")

# --- Scoring thresholds ---
SCORE_HOT = 80
SCORE_WARM = 50
TOP_N_NOTIFY = 10

# --- Scrape searches ---
SEARCHES = [
    # Construction (Long Island / NYC focus)
    {"term": "Project Manager Construction", "location": "New York, NY", "distance": 50},
    {"term": "Superintendent Construction", "location": "New York, NY", "distance": 50},
    {"term": "Estimator Construction", "location": "Long Island, NY", "distance": 30},

    # Healthcare
    {"term": "Director Revenue Cycle", "location": "New York, NY", "distance": 75},
    {"term": "VP Operations Healthcare", "location": "", "distance": 50},

    # Accounting / Finance
    {"term": "Controller", "location": "New York, NY", "distance": 50},
    {"term": "CFO", "location": "New York, NY", "distance": 50},
    {"term": "Tax Manager", "location": "New York, NY", "distance": 50},

    # Transportation / Logistics
    {"term": "Operations Manager Logistics", "location": "New Jersey", "distance": 50},
    {"term": "Regional Manager Transportation", "location": "New York, NY", "distance": 75},

    # Renewable Energy
    {"term": "VP Operations Solar", "location": "", "distance": 0},
    {"term": "Project Manager Renewable Energy", "location": "", "distance": 0},

    # Quant Finance
    {"term": "C++ Developer Quantitative", "location": "", "distance": 0},
    {"term": "Quantitative Developer", "location": "", "distance": 0},
]

# --- Known staffing agencies (auto-exclude) ---
STAFFING_AGENCIES = [
    "robert half", "randstad", "hays", "kforce", "adecco", "manpower",
    "kelly services", "insight global", "apex systems", "tek systems",
    "teksystems", "aerotek", "beacon hill", "staffing", "recruiting agency",
    "talent solutions", "spherion", "express employment", "modis",
    "accountemps", "creative circle", "aquent", "yoh", "addison group",
]

# --- Ghost job filters ---
MIN_DESCRIPTION_LENGTH = 200
MAX_IDENTICAL_ROLES = 5

# --- Stale window: postings not seen in this many days are considered inactive ---
ACTIVE_WINDOW_DAYS = 14
