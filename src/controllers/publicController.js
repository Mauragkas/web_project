const thesisService = require("../services/thesisService");
const instructorService = require("../services/instructorService");
const { Parser } = require("json2csv");
const js2xmlparser = require("js2xmlparser"); // npm install js2xmlparser

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
  // GET /public/api/announcements?start=YYYY-MM-DD&end=YYYY-MM-DD
  async getAnnouncements(req, res) {
    try {
      const { start, end } = req.query;
      const announcements =
        await thesisService.getPublicPresentationAnnouncements({
          startDate: start,
          endDate: end,
        });
      return res.json({ success: true, announcements });
    } catch (error) {
      console.error("Error fetching announcements:", error);
      return res.status(500).json({
        success: false,
        message: "Error retrieving announcements",
      });
    }
  }

  // GET /public/api/announcements/feed?format=xml/json&start=YYYY-MM-DD&end=YYYY-MM-DD
  async getAnnouncementsFeed(req, res) {
    try {
      const { format = "json", start, end } = req.query;
      const announcements =
        await thesisService.getPublicPresentationAnnouncements({
          startDate: start,
          endDate: end,
        });

      if (format === "xml") {
        // Use js2xmlparser for XML
        const xml = js2xmlparser.parse("announcements", {
          announcement: announcements,
        });
        res.header("Content-Type", "application/xml");
        res.attachment("announcements.xml");
        return res.send(xml);
      } else {
        // Default: JSON
        res.header("Content-Type", "application/json");
        res.attachment("announcements.json");
        return res.send(JSON.stringify(announcements, null, 2));
      }
    } catch (error) {
      console.error("Error generating announcements feed:", error);
      return res.status(500).json({
        success: false,
        message: "Error generating feed",
      });
    }
  }
}

module.exports = new PublicController();
