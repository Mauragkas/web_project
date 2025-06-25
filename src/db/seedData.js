const bcrypt = require("bcrypt");
const { executeRun, executeQuery, db } = require("./database");

async function seedUsers() {
  try {
    // Check if users already exist
    const users = await executeQuery("SELECT * FROM users");
    if (users.length > 0) {
      console.log("Users already exist in the database.");
      return;
    }

    // Hash passwords before inserting
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;

    const studentPassword = await bcrypt.hash("student123", saltRounds);
    const instructorPassword = await bcrypt.hash("instructor123", saltRounds);
    const secretariatPassword = await bcrypt.hash("secretariat123", saltRounds);

    // Insert sample users
    await executeRun(
      "INSERT INTO users (username, password, role, email, full_name) VALUES (?, ?, ?, ?, ?)",
      [
        "student1",
        studentPassword,
        "student",
        "student1@example.com",
        "Student One",
      ],
    );

    await executeRun(
      "INSERT INTO users (username, password, role, email, full_name) VALUES (?, ?, ?, ?, ?)",
      [
        "instructor1",
        instructorPassword,
        "instructor",
        "instructor1@example.com",
        "Instructor One",
      ],
    );

    await executeRun(
      "INSERT INTO users (username, password, role, email, full_name) VALUES (?, ?, ?, ?, ?)",
      [
        "secretariat1",
        secretariatPassword,
        "secretariat",
        "secretariat1@example.com",
        "Secretariat One",
      ],
    );

    console.log("Sample users have been added to the database.");
  } catch (error) {
    console.error("Error seeding users:", error);
  }
}

// Export a function to run all seed operations
async function seedDatabase() {
  try {
    await seedUsers();
    console.log("Database seeding completed successfully.");
  } catch (error) {
    console.error("Error during database seeding:", error);
  }
}

// Run the seeding if this script is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding completed, closing database connection.");
      db.close();
    })
    .catch((err) => {
      console.error("Seeding failed:", err);
      db.close();
    });
}

module.exports = { seedDatabase };
