-- users table
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('student', 'instructor', 'secretariat')),
    email TEXT UNIQUE,
    full_name TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Student fields
    name TEXT,
    surname TEXT,
    student_number TEXT,
    street TEXT,
    address_number TEXT,
    city TEXT,
    postcode TEXT,
    father_name TEXT,
    landline_telephone TEXT,
    mobile_telephone TEXT,

    -- Instructor fields
    topic TEXT,
    landline TEXT,
    mobile TEXT,
    department TEXT,
    university TEXT
);

-- thesis_topics table
CREATE TABLE IF NOT EXISTS thesis_topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instructor_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    document_path TEXT,
    status TEXT DEFAULT 'Available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- theses table
CREATE TABLE IF NOT EXISTS theses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic_id INTEGER NOT NULL,
    student_id INTEGER NOT NULL,
    supervisor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Under Assignment',
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completion_date TIMESTAMP,
    grade TEXT,
    library_link TEXT,
    presentation_date DATE,
    presentation_time TIME,
    presentation_location TEXT,
    presentation_location_type TEXT,
    connection_link TEXT,
    cancellation_reason TEXT,
    ga_number TEXT,
    ga_year TEXT,
    cancellation_date TIMESTAMP,
    draft_path TEXT,
    external_links TEXT,
    grading_active BOOLEAN DEFAULT FALSE,
    ap_number TEXT,
    FOREIGN KEY (topic_id) REFERENCES thesis_topics(id),
    FOREIGN KEY (student_id) REFERENCES users(id),
    FOREIGN KEY (supervisor_id) REFERENCES users(id)
);

-- Add thesis_status_history table for tracking status changes
CREATE TABLE IF NOT EXISTS thesis_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id)
);

-- committee_members table
CREATE TABLE IF NOT EXISTS committee_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'Invited',
    invitation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_date TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- thesis_notes table
CREATE TABLE IF NOT EXISTS thesis_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    note_text TEXT NOT NULL CHECK(length(note_text) <= 300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);

-- grades table for storing instructor grades
CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    grade_value REAL NOT NULL CHECK(grade_value >= 0 AND grade_value <= 10),
    criteria_json TEXT, -- JSON string containing detailed criteria scores
    comments TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id),
    UNIQUE(thesis_id, instructor_id)
);
