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

  async getThesisDetails(req, res) {
    try {
      const thesisId = req.params.thesisId;
      const thesis = await secretariatService.retrieveThesisDetails(thesisId);
      if (!thesis) {
        return res
          .status(404)
          .json({ success: false, message: "Thesis not found" });
      }
      res.json({ success: true, thesis });
    } catch (error) {
      console.error("Error fetching thesis details:", error);
      res.status(500).json({ success: false, message: "Server error" });
    }
  }
}

module.exports = new SecretariatController();
