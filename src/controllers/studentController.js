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

      // Validate: thesisId belongs to student and is Under Assignment
      // (You can add a check here if needed)

      await studentService.processCommitteeInvitations(thesisId, instructorIds);
      res.json({ success: true, message: "Invitations sent" });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  }
}

module.exports = new StudentController();
