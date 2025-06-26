const thesisService = require("../services/thesisService");
const instructorService = require("../services/instructorService");

class PublicController {
  /**
   * Get all available thesis topics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAvailableTopics(req, res) {
    try {
      const { keyword, instructor } = req.query;
      const filters = {
        status: "Available",
        keyword: keyword || null,
        instructorId: instructor || null,
      };

      const topics = await thesisService.getPublicAvailableTopics(filters);

      return res.json({
        success: true,
        topics,
      });
    } catch (error) {
      console.error("Error fetching available topics:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving available topics",
      });
    }
  }

  /**
   * Get all instructors for filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAllInstructors(req, res) {
    try {
      // Get all instructors with available topics
      const instructors =
        await instructorService.getInstructorsWithAvailableTopics();

      return res.json({
        success: true,
        instructors,
      });
    } catch (error) {
      console.error("Error fetching instructors:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving instructors",
      });
    }
  }
}

module.exports = new PublicController();
