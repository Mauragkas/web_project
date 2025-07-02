const fs = require("fs");
const path = require("path");
const bcrypt = require("bcrypt");
const { executeRun, db } = require("./database");

const jsonPath = path.join(__dirname, "../../database/export.json");

async function importUsers() {
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
  const defaultPassword = "changeme123";
  const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

  const data = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

  async function insertUser(user, role) {
    let fields = [
      "username",
      "password",
      "role",
      "email",
      "full_name",
      "name",
      "surname",
      "student_number",
      "street",
      "address_number",
      "city",
      "postcode",
      "father_name",
      "landline_telephone",
      "mobile_telephone",
      "topic",
      "landline",
      "mobile",
      "department",
      "university",
    ];

    let values = [];
    let username =
      (user.email && user.email.split("@")[0]) ||
      (user.name && user.surname
        ? (user.name + user.surname).replace(/\s/g, "").toLowerCase()
        : "user" + user.id);

    let full_name =
      (user.name ? user.name : "") + (user.surname ? " " + user.surname : "");

    let address_number = user.number || user.address_number || null;

    let mobile = user.mobile || user.mobile_telephone || null;
    let landline = user.landline || user.landline_telephone || null;

    values.push(
      username,
      hashedPassword,
      role,
      user.email || null,
      full_name.trim() || null,
      user.name || null,
      user.surname || null,
      user.student_number || null,
      user.street || null,
      address_number,
      user.city || null,
      user.postcode || null,
      user.father_name || null,
      landline,
      mobile,
      user.topic || null,
      user.landline || null,
      user.mobile || null,
      user.department || null,
      user.university || null,
    );

    const placeholders = fields.map(() => "?").join(",");
    const query = `INSERT OR IGNORE INTO users (${fields.join(
      ",",
    )}) VALUES (${placeholders})`;

    await executeRun(query, values);
  }

  for (const student of data.students || []) {
    await insertUser(student, "student");
  }
  for (const instructor of data.instructors || data.professors || []) {
    await insertUser(instructor, "instructor");
  }
}

if (require.main === module) {
  importUsers()
    .then(() => {
      console.log("Import completed.");
      db.close();
    })
    .catch((err) => {
      console.error("Import failed:", err);
      db.close();
    });
}

module.exports = { importUsers };
