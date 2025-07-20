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

  async importUserData(req, res) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "No file uploaded." });
      }
      // Pass buffer to service
      const result = await secretariatService.processUserDataImport(
        req.file.buffer,
      );
      if (result.success) {
        return res.json({
          success: true,
          importedCount: result.importedCount,
          message: result.message || "Import successful.",
        });
      } else {
        return res.status(400).json({
          success: false,
          message: result.message || "Import failed.",
        });
      }
    } catch (error) {
      console.error("Import user data error:", error);
      return res
        .status(500)
        .json({ success: false, message: "Server error during import." });
    }
  }

  async recordApNumber(req, res) {
    try {
      const thesisId = req.params.thesisId;
      const { apNumber } = req.body;

      if (!apNumber) {
        return res
          .status(400)
          .json({ success: false, message: "AP number is required." });
      }

      const result = await secretariatService.saveGeneralAssemblyApNumber(
        thesisId,
        apNumber,
      );

      if (result.success) {
        return res.json({ success: true, message: "AP number recorded." });
      } else {
        return res
          .status(400)
          .json({ success: false, message: result.message });
      }
    } catch (error) {
      console.error("Record AP number error:", error);
      return res.status(500).json({ success: false, message: "Server error." });
    }
  }
}

module.exports = new SecretariatController();
