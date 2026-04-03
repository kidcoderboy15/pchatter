-- Every job posting we've ever seen
CREATE TABLE IF NOT EXISTS postings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT UNIQUE,
    company TEXT NOT NULL,
    title TEXT NOT NULL,
    location TEXT,
    industry TEXT,
    description TEXT,
    salary_min REAL,
    salary_max REAL,
    source TEXT,
    source_url TEXT,
    first_seen DATE NOT NULL,
    last_seen DATE NOT NULL,
    times_seen INTEGER DEFAULT 1,
    repost_count INTEGER DEFAULT 0,
    description_changed BOOLEAN DEFAULT 0,
    salary_changed BOOLEAN DEFAULT 0,
    applicant_count INTEGER,
    score INTEGER DEFAULT 0,
    status TEXT DEFAULT 'watch',
    contacted BOOLEAN DEFAULT 0,
    contacted_date DATE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- History of each scrape for diffing
CREATE TABLE IF NOT EXISTS scrape_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id TEXT,
    scrape_date DATE,
    description_hash TEXT,
    salary_min REAL,
    salary_max REAL,
    applicant_count INTEGER,
    was_missing BOOLEAN DEFAULT 0
);

-- Ghost job exclusion list
CREATE TABLE IF NOT EXISTS exclusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company TEXT,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
