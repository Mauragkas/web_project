const studentService = require("../services/studentService");

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
}

module.exports = new StudentController();
