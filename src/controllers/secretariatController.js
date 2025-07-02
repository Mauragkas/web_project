const secretariatService = require("../services/secretariatService");

class SecretariatController {
  async getActiveAndUnderExaminationTheses(req, res) {
    try {
      const theses =
        await secretariatService.retrieveActiveAndUnderExaminationTheses();
      res.json({ success: true, theses });
    } catch (error) {
      console.error("Error fetching theses:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new SecretariatController();
