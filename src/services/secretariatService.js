const thesisService = require("./thesisService");

class SecretariatService {
  async retrieveActiveAndUnderExaminationTheses() {
    return thesisService.getThesesByStatuses([
      "Active",
      "Under Examination",
      "Graded",
    ]);
  }

  async retrieveThesisDetails(thesisId) {
    return thesisService.getFullThesisDetails(thesisId);
  }

  async processUserDataImport(fileBuffer) {
    try {
      // Parse JSON
      const jsonStr = fileBuffer.toString("utf8");
      let data;
      try {
        data = JSON.parse(jsonStr);
      } catch (err) {
        return { success: false, message: "Invalid JSON file." };
      }

      // Password logic (same as importUsers.js)
      const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
      const defaultPassword = "changeme123";
      const hashedPassword = await bcrypt.hash(defaultPassword, saltRounds);

      // Prepare users
      let usersToInsert = [];
      let importedCount = 0;

      function prepareUser(user, role) {
        let username =
          (user.email && user.email.split("@")[0]) ||
          (user.name && user.surname
            ? (user.name + user.surname).replace(/\s/g, "").toLowerCase()
            : "user" + Math.floor(Math.random() * 1000000));
        let full_name =
          (user.name ? user.name : "") +
          (user.surname ? " " + user.surname : "");
        let address_number = user.number || user.address_number || null;
        let mobile = user.mobile || user.mobile_telephone || null;
        let landline = user.landline || user.landline_telephone || null;

        return [
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
        ];
      }

      // Insert students
      for (const student of data.students || []) {
        usersToInsert.push({
          query: `INSERT OR IGNORE INTO users (
              username, password, role, email, full_name, name, surname, student_number, street, address_number, city, postcode, father_name, landline_telephone, mobile_telephone, topic, landline, mobile, department, university
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: prepareUser(student, "student"),
        });
      }
      // Insert instructors
      for (const instructor of data.instructors || data.professors || []) {
        usersToInsert.push({
          query: `INSERT OR IGNORE INTO users (
              username, password, role, email, full_name, name, surname, student_number, street, address_number, city, postcode, father_name, landline_telephone, mobile_telephone, topic, landline, mobile, department, university
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          params: prepareUser(instructor, "instructor"),
        });
      }

      if (usersToInsert.length === 0) {
        return { success: false, message: "No users found in JSON file." };
      }

      // Transactional insert
      const results = await executeTransaction(usersToInsert);

      // Count how many were actually inserted (changes > 0)
      importedCount = results.filter((r) => r.changes > 0).length;

      return {
        success: true,
        importedCount,
        message: `Imported ${importedCount} users. Default password: "${defaultPassword}".`,
      };
    } catch (error) {
      console.error("processUserDataImport error:", error);
      return { success: false, message: "Import failed: " + error.message };
    }
  }

  async saveGeneralAssemblyApNumber(thesisId, apNumber) {
    // Optionally validate apNumber format here
    if (!apNumber || typeof apNumber !== "string" || apNumber.length < 3) {
      return { success: false, message: "Invalid AP number" };
    }
    return thesisService.updateThesisApNumber(thesisId, apNumber);
  }

  async cancelThesisAssignmentBySecretariat(
    thesisId,
    gaNumber,
    gaYear,
    reason,
  ) {
    try {
      // Validate inputs
      if (!gaNumber || !gaYear) {
        return {
          success: false,
          message: "General Assembly Number and Year are required",
        };
      }

      // Check if thesis exists and is Active
      const thesis = await require("./thesisService").getThesisById(thesisId);
      if (!thesis) {
        return { success: false, message: "Thesis not found" };
      }

      if (thesis.status !== "Active") {
        return {
          success: false,
          message: "Only Active theses can be cancelled",
        };
      }

      // Cancel the thesis
      const result = await require("./thesisService").cancelThesisBySecretariat(
        thesisId,
        gaNumber,
        gaYear,
        reason || "Cancelled by secretariat with General Assembly approval",
      );

      return {
        success: true,
        message: "Thesis assignment cancelled successfully",
      };
    } catch (error) {
      console.error("Error cancelling thesis assignment:", error);
      return { success: false, message: "Failed to cancel thesis assignment" };
    }
  }

  async checkThesisCompletionReadiness(thesisId) {
    try {
      return await require("./thesisService").verifyGradesAndNemertisLink(
        thesisId,
      );
    } catch (error) {
      console.error("Error checking thesis completion readiness:", error);
      throw error;
    }
  }

  async finalizeThesisCompletion(thesisId) {
    try {
      const result =
        await require("./thesisService").markThesisAsCompleted(thesisId);
      return {
        success: true,
        message: "Thesis marked as completed successfully",
        avgGrade: result.avgGrade,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Failed to complete thesis",
      };
    }
  }
}

module.exports = new SecretariatService();
