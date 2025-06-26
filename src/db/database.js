const sqlite3 = require("sqlite3").verbose();
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require("fs");

const dbPath = path.join(__dirname, "../../database/thesis.sqlite");

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

// Initialize database with additional tables needed for assignments
function initializeDatabase() {
  db.serialize(() => {
    // Create users table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT NOT NULL,
            email TEXT UNIQUE,
            full_name TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

    // Create thesis_topics table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS thesis_topics (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            instructor_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            document_path TEXT,
            status TEXT DEFAULT 'Available',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        )`);

    // Create theses table for assignments
    db.run(`CREATE TABLE IF NOT EXISTS theses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            topic_id INTEGER NOT NULL,
            student_id INTEGER NOT NULL,
            supervisor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Under Assignment',
            assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completion_date TIMESTAMP,
            grade TEXT,
            ap_number TEXT,
            library_link TEXT,
            FOREIGN KEY (topic_id) REFERENCES thesis_topics(id),
            FOREIGN KEY (student_id) REFERENCES users(id),
            FOREIGN KEY (supervisor_id) REFERENCES users(id)
        )`);

    // Create committee_members table
    db.run(`CREATE TABLE IF NOT EXISTS committee_members (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thesis_id INTEGER NOT NULL,
            instructor_id INTEGER NOT NULL,
            status TEXT DEFAULT 'Invited',
            invitation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            response_date TIMESTAMP,
            FOREIGN KEY (thesis_id) REFERENCES theses(id),
            FOREIGN KEY (instructor_id) REFERENCES users(id)
        )`);
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
};
