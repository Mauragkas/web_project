PRAGMA foreign_keys=OFF;
BEGIN TRANSACTION;
CREATE TABLE users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT UNIQUE,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
INSERT INTO users VALUES(7,'student1','$2b$10$HVhJWcbvg3m2HROkV8skAexPXk2RIk.skOKxC0vBbHFLQcjIfP8im','student','student1@example.com','Student One','2025-06-25 17:09:30');
INSERT INTO users VALUES(8,'instructor1','$2b$10$l3yPtcY99TtVLUn1HgSelO2/mSelE.LEbAKnZ9pVK6fjryIkiRn/u','instructor','instructor1@example.com','Instructor One','2025-06-25 17:09:30');
INSERT INTO users VALUES(9,'secretariat1','$2b$10$UfJ6iUVHu0RL5zIy8PzrR.f/sQmZg6p5S3V0DanUA3ESnBuiKg7Z6','secretariat','secretariat1@example.com','Secretariat One','2025-06-25 17:09:30');
CREATE TABLE thesis_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instructor_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            document_path TEXT,
            status TEXT DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        );
INSERT INTO thesis_topics VALUES(6,8,'REEEEEEEEEEE','REEEEEEEEEEE',NULL,'Under Assignment','2025-06-26 11:16:51');
INSERT INTO thesis_topics VALUES(7,8,'asdfasdf','asdfasdfasdf','/uploads/topics/1751021968159-document.pdf','Available','2025-06-26 17:34:28');
INSERT INTO thesis_topics VALUES(8,8,'Machine Learning for Healthcare','Applying machine learning techniques to healthcare data for improved diagnostics',NULL,'Available','2025-06-27 13:00:51');
INSERT INTO thesis_topics VALUES(9,8,'Machine Learning for Healthcare Analytics','Using AI techniques to analyze healthcare data and improve patient outcomes.',NULL,'Under Assignment','2025-06-27 14:10:51');
INSERT INTO thesis_topics VALUES(10,8,'Test Active Thesis','A test thesis for note functionality.',NULL,'Under Assignment','2025-06-27 14:12:58');
INSERT INTO thesis_topics VALUES(11,8,'Test Thesis for Cancellation','A thesis to test supervisor cancellation after 2 years.',NULL,'Active','2021-06-15');
CREATE TABLE theses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            supervisor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Under Assignment',
            assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completion_date TIMESTAMP,
            grade TEXT,
            ap_number TEXT,
            library_link TEXT, presentation_date DATE, presentation_time TIME, presentation_location TEXT, cancellation_reason TEXT, ga_number TEXT, ga_year TEXT, cancellation_date TIMESTAMP,
            FOREIGN KEY (topic_id) REFERENCES thesis_topics(id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (supervisor_id) REFERENCES users(id)
        );
INSERT INTO theses VALUES(1,6,7,8,'Cancelled','2025-06-26 11:47:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(2,6,7,8,'Cancelled','2025-06-26 11:52:14',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(3,6,7,8,'Under Examination','2025-06-26 11:57:37',NULL,NULL,NULL,NULL,'2025-07-15','14:30','Room A102, Engineering Building',NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(4,7,7,8,'Cancelled','2025-06-27 10:16:23',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(5,8,7,8,'Under Examination','2025-05-28',NULL,NULL,NULL,NULL,'2025-07-07','15:00','Conference Room B, Computer Science Department',NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(6,9,7,8,'Active','2025-05-28 14:10:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(7,10,7,8,'Active','2025-06-17 14:12:58',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL);
INSERT INTO theses VALUES(8,9,7,8,'Cancelled','2021-06-20',NULL,NULL,NULL,NULL,NULL,NULL,NULL,'asdffasdf','20012312313','2025','2025-06-27 14:53:20');
CREATE TABLE committee_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thesis_id INTEGER NOT NULL,
            instructor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Invited',
            invitation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_date TIMESTAMP,
            FOREIGN KEY (thesis_id) REFERENCES theses(id),
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        );
INSERT INTO committee_members VALUES(2,3,8,'Accepted','2025-06-27 12:59:35','2025-06-27 12:59:35');
INSERT INTO committee_members VALUES(3,5,8,'Accepted','2025-06-07','2025-06-12');
INSERT INTO committee_members VALUES(4,6,8,'Accepted','2025-06-07 14:11:03','2025-06-09 14:11:03');
INSERT INTO committee_members VALUES(5,6,9,'Accepted','2025-06-07 14:11:03','2025-06-12 14:11:03');
INSERT INTO committee_members VALUES(6,7,8,'Accepted','2025-06-18 14:12:58','2025-06-19 14:12:58');
INSERT INTO committee_members VALUES(7,7,9,'Accepted','2025-06-18 14:12:58','2025-06-19 14:12:58');
CREATE TABLE thesis_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    instructor_id INTEGER NOT NULL,
    note_text TEXT NOT NULL CHECK(length(note_text) <= 300),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id),
    FOREIGN KEY (instructor_id) REFERENCES users(id)
);
INSERT INTO thesis_notes VALUES(1,7,8,'asfasdfasfd','2025-06-27 14:45:17');
CREATE TABLE thesis_status_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    thesis_id INTEGER NOT NULL,
    old_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (thesis_id) REFERENCES theses(id)
);
INSERT INTO thesis_status_history VALUES(1,8,'Active','Cancelled','Instructor (8)','2025-06-27 14:53:20');
INSERT INTO sqlite_sequence VALUES('users',9);
INSERT INTO sqlite_sequence VALUES('thesis_topics',11);
INSERT INTO sqlite_sequence VALUES('theses',8);
INSERT INTO sqlite_sequence VALUES('committee_members',7);
INSERT INTO sqlite_sequence VALUES('thesis_notes',1);
INSERT INTO sqlite_sequence VALUES('thesis_status_history',1);
COMMIT;
