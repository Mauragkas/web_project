const studentService = require("../services/studentService");
const instructorService = require("../services/instructorService");

class StudentController {
  /**
   * Get current thesis info for the logged-in student
   */
  async getDashboardData(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisInfo = await studentService.getCurrentThesisInfo(studentId);

      if (!thesisInfo) {
        return res.json({ success: true, thesis: null });
      }

      return res.json({ success: true, thesis: thesisInfo });
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async searchInstructors(req, res) {
    try {
      const query = req.query.query || "";
      const instructors = await instructorService.getAllInstructors(query);
      res.json({ success: true, instructors });
    } catch (error) {
      res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // POST: Invite committee members
  async inviteCommitteeMembers(req, res) {
    try {
      const studentId = req.session.userId;
      const { thesisId, instructorIds } = req.body;

      // FIXED: Validate thesisId exists and belongs to this student
      if (!thesisId) {
        return res.status(400).json({
          success: false,
          message: "Thesis ID is required",
        });
      }

      // Check if thesis belongs to this student
      const thesisBelongsToStudent =
        await studentService.verifyThesisBelongsToStudent(thesisId, studentId);

      if (!thesisBelongsToStudent) {
        return res.status(403).json({
          success: false,
          message:
            "You don't have permission to invite committee members for this thesis",
        });
      }

      // Validate: instructorIds is an array and not empty
      if (!Array.isArray(instructorIds) || instructorIds.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No instructors selected",
        });
      }

      await studentService.processCommitteeInvitations(thesisId, instructorIds);
      res.json({ success: true, message: "Invitations sent" });
    } catch (error) {
      console.error("Error inviting committee members:", error);
      res.status(400).json({ success: false, message: error.message });
    }
  }

  async updateProfile(req, res) {
    try {
      const studentId = req.session.userId;
      const {
        email,
        street,
        address_number,
        city,
        postcode,
        mobile_telephone,
        landline_telephone,
      } = req.body;

      // Basic validation
      if (!email || !street || !address_number || !city || !postcode) {
        return res.status(400).json({
          success: false,
          message: "All fields except phones are required.",
        });
      }

      // Optionally: validate email format, phone numbers, etc.

      // Update in DB
      const { executeRun } = require("../db/database");
      const result = await executeRun(
        `UPDATE users SET
          email = ?,
          street = ?,
          address_number = ?,
          city = ?,
          postcode = ?,
          mobile_telephone = ?,
          landline_telephone = ?
        WHERE id = ? AND role = 'student'`,
        [
          email,
          street,
          address_number,
          city,
          postcode,
          mobile_telephone,
          landline_telephone,
          studentId,
        ],
      );

      if (result.changes > 0) {
        return res.json({ success: true, message: "Profile updated." });
      } else {
        return res.status(400).json({
          success: false,
          message: "No changes made or user not found.",
        });
      }
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
  async uploadMaterials(req, res) {
    try {
      const studentId = req.session.userId;
      const { thesisId, externalLinks } = req.body;
      const draftFile = req.file;

      // Validate input
      if (!thesisId) {
        return res
          .status(400)
          .json({ success: false, message: "Thesis ID is required" });
      }

      // Check thesis belongs to student and is Under Examination
      const thesis = await require("../services/thesisService").getThesisById(
        thesisId,
      );
      if (!thesis || thesis.student_id != studentId) {
        return res
          .status(403)
          .json({ success: false, message: "Access denied" });
      }
      if (thesis.status !== "Under Examination") {
        return res.status(400).json({
          success: false,
          message: "Thesis must be Under Examination",
        });
      }

      // Call service to handle upload
      const result =
        await require("../services/studentService").handleMaterialUpload(
          thesisId,
          draftFile,
          externalLinks,
        );

      if (result.success) {
        return res.json({
          success: true,
          message: "Materials uploaded successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Failed to upload materials",
        });
      }
    } catch (error) {
      console.error("Upload materials error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async getPresentationDetails(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisId = req.params.thesisId;

      // Verify thesis belongs to student and is Under Examination
      const thesis = await require("../services/thesisService").getThesisById(
        thesisId,
      );

      if (!thesis || thesis.student_id != studentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: This thesis doesn't belong to you",
        });
      }

      if (thesis.status !== "Under Examination") {
        return res.status(400).json({
          success: false,
          message:
            "Presentation details can only be recorded for theses under examination",
        });
      }

      const presentationDetails =
        await studentService.retrievePresentationDetails(studentId, thesisId);

      return res.json({
        success: true,
        details: presentationDetails,
      });
    } catch (error) {
      console.error("Error getting presentation details:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async submitPresentationDetails(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisId = req.params.thesisId;
      const presentationData = req.body;

      // Step 1: Add Logging
      console.log("Presentation details received:", presentationData);

      // Validate required fields
      const {
        presentationDate,
        presentationTime,
        examinationMethod,
        location,
        connectionLink,
      } = presentationData;

      if (!presentationDate || !presentationTime || !examinationMethod) {
        return res.status(400).json({
          success: false,
          message: "Date, time, and examination method are required",
        });
      }

      if (examinationMethod === "in-person" && !location) {
        return res.status(400).json({
          success: false,
          message: "Location is required for in-person examinations",
        });
      }

      if (examinationMethod === "online" && !connectionLink) {
        return res.status(400).json({
          success: false,
          message: "Connection link is required for online examinations",
        });
      }

      // Verify thesis belongs to student and is Under Examination
      const thesis = await require("../services/thesisService").getThesisById(
        thesisId,
      );

      if (!thesis || thesis.student_id != studentId) {
        return res.status(403).json({
          success: false,
          message: "Access denied: This thesis doesn't belong to you",
        });
      }

      if (thesis.status !== "Under Examination") {
        return res.status(400).json({
          success: false,
          message:
            "Presentation details can only be recorded for theses under examination",
        });
      }

      // Step 1: Add Logging before DB update
      const finalLocation = location;
      const finalConnectionLink = connectionLink;
      console.log("Updating thesis with:", {
        presentationDate,
        presentationTime,
        finalLocation,
        examinationMethod,
        finalConnectionLink,
        thesisId,
        studentId,
      });

      const result = await studentService.savePresentationDetails(
        studentId,
        thesisId,
        presentationData,
      );

      if (result.success) {
        return res.json({
          success: true,
          message: "Presentation details recorded successfully",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Failed to save presentation details",
        });
      }
    } catch (error) {
      console.error("Error submitting presentation details:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  async getExaminationReport(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisId = req.params.thesisId;

      // Generate the HTML report
      const html = await studentService.generateExaminationReport(
        studentId,
        thesisId,
      );

      if (!html) {
        return res
          .status(404)
          .send("Examination report not found or not available.");
      }

      // Serve as HTML
      res.setHeader("Content-Type", "text/html");
      return res.send(html);
    } catch (error) {
      console.error("Error generating examination report:", error);
      return res.status(500).send("Failed to generate examination report.");
    }
  }

  async recordRepositoryLink(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisId = req.params.thesisId;
      const { nemertisLink } = req.body;

      // Basic validation
      if (
        !nemertisLink ||
        typeof nemertisLink !== "string" ||
        !nemertisLink.startsWith("http")
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid Nemertis link is required.",
        });
      }

      // Call service
      const result = await studentService.saveRepositoryLink(
        studentId,
        thesisId,
        nemertisLink,
      );

      if (result.success) {
        return res.json({
          success: true,
          message: "Repository link recorded.",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Failed to record link.",
        });
      }
    } catch (error) {
      console.error("Error recording repository link:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }

  async getCompletedThesisDetails(req, res) {
    try {
      const studentId = req.session.userId;
      const thesisId = req.params.thesisId;

      // Verify thesis belongs to student and is completed
      const thesis = await studentService.retrieveCompletedThesisInfo(
        studentId,
        thesisId,
      );
      if (!thesis) {
        return res.status(404).json({
          success: false,
          message: "Thesis not found or not completed.",
        });
      }

      return res.json({
        success: true,
        thesis: thesis.details,
        statusHistory: thesis.statusHistory,
        grades: thesis.grades,
      });
    } catch (error) {
      console.error("Error fetching completed thesis details:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new StudentController();
