const moderationService = require("../../services/moderationService");

const recheckModeration = async (req, res, next) => {
  try {
    const { type, id } = req.params;

    const result = await moderationService.moderateContent(type, id);

    res.status(200).json({
      success: true,
      message: "Moderation re-check completed",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { recheckModeration };