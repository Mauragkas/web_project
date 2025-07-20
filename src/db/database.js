const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");

const dbPath = path.join(__dirname, "../../database/thesis.sqlite");
const schemaPath = path.join(__dirname, "../../database/schemas.sql");

// Ensure database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Error connecting to database:", err.message);
  } else {
    console.log("Connected to the SQLite database.");
    initializeDatabase();
  }
});

// Initialize database by executing schema from file
function initializeDatabase() {
  const schema = fs.readFileSync(schemaPath, "utf8");
  db.exec(schema, (err) => {
    if (err) {
      console.error("Error initializing database schema:", err.message);
    } else {
      console.log("Database schema initialized.");
    }
  });
}

// Execute a transaction with multiple operations
function executeTransaction(operations) {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");

      const promises = operations.map((operation) => {
        return new Promise((resolveOp, rejectOp) => {
          db.run(operation.query, operation.params, function (err) {
            if (err) {
              rejectOp(err);
            } else {
              resolveOp({ lastID: this.lastID, changes: this.changes });
            }
          });
        });
      });

      Promise.all(promises)
        .then((results) => {
          db.run("COMMIT", (err) => {
            if (err) {
              db.run("ROLLBACK");
              reject(err);
            } else {
              resolve(results);
            }
          });
        })
        .catch((err) => {
          db.run("ROLLBACK");
          reject(err);
        });
    });
  });
}

// Execute a query with parameters
function executeQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Execute a single insert/update/delete operation
function executeRun(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

// Get a single row
function getOne(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Find instructors by name or username
function findInstructors(query) {
  const q = `%${query}%`;
  return executeQuery(
    `SELECT id, username, full_name, email
     FROM users
     WHERE role = 'instructor' AND (username LIKE ? OR full_name LIKE ?)
     LIMIT 10`,
    [q, q],
  );
}

// Insert committee invitations (bulk)
function insertCommitteeInvitations(thesisId, instructorIds) {
  const ops = instructorIds.map((id) => ({
    query: `INSERT INTO committee_members (thesis_id, instructor_id, status) VALUES (?, ?, 'Invited')`,
    params: [thesisId, id],
  }));
  return executeTransaction(ops);
}

// Get count of accepted committee members for a thesis
function countAcceptedCommittee(thesisId) {
  return getOne(
    `SELECT COUNT(*) as acceptedCount FROM committee_members WHERE thesis_id = ? AND status = 'Accepted'`,
    [thesisId],
  );
}

// Update thesis status
function updateThesisStatus(thesisId, status) {
  return executeRun(`UPDATE theses SET status = ? WHERE id = ?`, [
    status,
    thesisId,
  ]);
}

// Get a single thesis topic by id and instructor
function getThesisTopicByIdAndInstructor(topicId, instructorId) {
  return getOne(
    "SELECT * FROM thesis_topics WHERE id = ? AND instructor_id = ?",
    [topicId, instructorId],
  );
}

// Update a thesis topic
function updateThesisTopic(
  topicId,
  instructorId,
  title,
  description,
  documentPath,
) {
  return executeRun(
    `UPDATE thesis_topics
     SET title = ?, description = ?, document_path = ?
     WHERE id = ? AND instructor_id = ?`,
    [title, description, documentPath, topicId, instructorId],
  );
}

function getCommitteeInvitationsForInstructor(instructorId) {
  const query = `
    SELECT
      cm.id as invitation_id,
      cm.status as invitation_status,
      cm.invitation_date,
      cm.response_date,
      t.id as thesis_id,
      t.status as thesis_status,
      t.assigned_date,
      tt.title as topic_title,
      u.full_name as student_name,
      s.full_name as supervisor_name
    FROM committee_members cm
    JOIN theses t ON cm.thesis_id = t.id
    JOIN thesis_topics tt ON t.topic_id = tt.id
    JOIN users u ON t.student_id = u.id
    JOIN users s ON t.supervisor_id = s.id
    WHERE cm.instructor_id = ?
    ORDER BY cm.invitation_date DESC
  `;
  return executeQuery(query, [instructorId]);
}

// Get a single invitation by id and instructor
function getCommitteeInvitationById(invitationId, instructorId) {
  const query = `
    SELECT * FROM committee_members
    WHERE id = ? AND instructor_id = ?
    LIMIT 1
  `;
  return getOne(query, [invitationId, instructorId]);
}

// Update invitation status (accept/reject)
function updateCommitteeInvitationStatus(invitationId, instructorId, status) {
  const query = `
    UPDATE committee_members
    SET status = ?, response_date = CURRENT_TIMESTAMP
    WHERE id = ? AND instructor_id = ?
  `;
  return executeRun(query, [status, invitationId, instructorId]);
}

// Count accepted invitations for a thesis
function countAcceptedCommitteeMembers(thesisId) {
  return getOne(
    `SELECT COUNT(*) as acceptedCount FROM committee_members WHERE thesis_id = ? AND status = 'Accepted'`,
    [thesisId],
  );
}

// Add a private note to a thesis
function insertThesisNote(thesisId, instructorId, noteText) {
  return executeRun(
    `INSERT INTO thesis_notes (thesis_id, instructor_id, note_text) VALUES (?, ?, ?)`,
    [thesisId, instructorId, noteText],
  );
}

// Get all notes for a thesis by this instructor
function getThesisNotesForInstructor(thesisId, instructorId) {
  return executeQuery(
    `SELECT id, note_text, created_at
     FROM thesis_notes
     WHERE thesis_id = ? AND instructor_id = ?
     ORDER BY created_at DESC`,
    [thesisId, instructorId],
  );
}

function getPublicPresentationAnnouncements({ startDate, endDate }) {
  let query = `
    SELECT
      t.id as thesis_id,
      tt.title as thesis_title,
      u.full_name as student_name,
      s.full_name as supervisor_name,
      GROUP_CONCAT(cm2.full_name, ', ') as committee_members,
      t.presentation_date,
      t.presentation_time,
      t.presentation_location,
      t.connection_link,
      t.presentation_location_type
    FROM theses t
    JOIN thesis_topics tt ON t.topic_id = tt.id
    JOIN users u ON t.student_id = u.id
    JOIN users s ON t.supervisor_id = s.id
    LEFT JOIN committee_members cm ON cm.thesis_id = t.id
    LEFT JOIN users cm2 ON cm2.id = cm.instructor_id
    WHERE t.presentation_date IS NOT NULL
      AND t.presentation_date >= ?
      AND t.presentation_date <= ?
      AND t.status IN ('Under Examination', 'Completed')
    GROUP BY t.id
    ORDER BY t.presentation_date ASC, t.presentation_time ASC
  `;
  return executeQuery(query, [startDate, endDate]);
}

function getThesisById(thesisId) {
  return getOne(`SELECT * FROM theses WHERE id = ?`, [thesisId]);
}

function getThesisPresentationDetailsForAnnouncement(thesisId, instructorId) {
  const query = `
    SELECT
      t.id as thesis_id,
      tt.title as thesis_title,
      u.full_name as student_name,
      t.presentation_date,
      t.presentation_time,
      t.presentation_location,
      s.full_name as supervisor_name
    FROM theses t
    JOIN thesis_topics tt ON t.topic_id = tt.id
    JOIN users u ON t.student_id = u.id
    JOIN users s ON t.supervisor_id = s.id
    WHERE t.id = ?
      AND t.status = 'Under Examination'
      AND t.supervisor_id = ?
    LIMIT 1
  `;
  return getOne(query, [thesisId, instructorId]);
}

// Get all grades for a thesis
function getThesisGrades(thesisId) {
  const query = `
    SELECT
      g.instructor_id,
      g.grade_value,
      g.criteria_json,
      g.comments,
      g.created_at,
      u.full_name as instructor_name,
      CASE
        WHEN t.supervisor_id = g.instructor_id THEN 'supervisor'
        ELSE 'committee'
      END as instructor_role
    FROM grades g
    JOIN users u ON g.instructor_id = u.id
    JOIN theses t ON g.thesis_id = t.id
    WHERE g.thesis_id = ?
    ORDER BY g.created_at DESC
  `;
  return executeQuery(query, [thesisId]);
}

// Insert or update grade
function upsertGrade(
  thesisId,
  instructorId,
  gradeValue,
  criteriaJson,
  comments,
) {
  const query = `
    INSERT OR REPLACE INTO grades
    (thesis_id, instructor_id, grade_value, criteria_json, comments, updated_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `;
  return executeRun(query, [
    thesisId,
    instructorId,
    gradeValue,
    criteriaJson,
    comments,
  ]);
}

// Count submitted grades for a thesis
function countSubmittedGrades(thesisId) {
  return getOne(
    `SELECT COUNT(DISTINCT instructor_id) as count FROM grades WHERE thesis_id = ?`,
    [thesisId],
  );
}

// Count expected graders (supervisor + committee members)
function countExpectedGraders(thesisId) {
  const query = `
    SELECT
      (1 + COUNT(cm.instructor_id)) as count
    FROM theses t
    LEFT JOIN committee_members cm ON cm.thesis_id = t.id AND cm.status = 'Accepted'
    WHERE t.id = ?
    GROUP BY t.id
  `;
  return getOne(query, [thesisId]);
}

// Activate grading for a thesis
function activateThesisGrading(thesisId, supervisorId) {
  return executeRun(
    `UPDATE theses SET grading_active = TRUE WHERE id = ? AND supervisor_id = ?`,
    [thesisId, supervisorId],
  );
}

// Check if grading is active
function isGradingActive(thesisId) {
  return getOne(`SELECT grading_active FROM theses WHERE id = ?`, [thesisId]);
}

async function updateThesisApNumber(thesisId, apNumber) {
  return executeRun(
    `UPDATE theses SET ap_number = ? WHERE id = ? AND status = 'Active'`,
    [apNumber, thesisId],
  );
}

module.exports = {
  executeQuery,
  executeRun,
  getOne,
  executeTransaction,
  db,
  close: () => {
    return new Promise((resolve, reject) => {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  },
  getThesisTopicByIdAndInstructor,
  updateThesisTopic,
  findInstructors,
  insertCommitteeInvitations,
  countAcceptedCommittee,
  updateThesisStatus,
  getCommitteeInvitationsForInstructor,
  getCommitteeInvitationById,
  updateCommitteeInvitationStatus,
  countAcceptedCommitteeMembers,
  insertThesisNote,
  getThesisNotesForInstructor,
  getPublicPresentationAnnouncements,
  getThesisById,
  getThesisPresentationDetailsForAnnouncement,
  getThesisGrades,
  upsertGrade,
  countSubmittedGrades,
  countExpectedGraders,
  activateThesisGrading,
  isGradingActive,
  updateThesisApNumber,
};
