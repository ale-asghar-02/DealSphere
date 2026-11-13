const announcementModel = require("../../models/announcementModel");
const AppError = require("../../utils/AppError");

const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, type, targetAudience, link, durationInHours } = req.body;

    let expiresAt = null;
    if (durationInHours) {
      if (durationInHours <= 0) {
        return next(new AppError("Duration in hours must be greater than 0", 400));
      }
      expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + Number(durationInHours));
    }

    const announcement = await announcementModel.create({
      title,
      message,
      type,
      targetAudience,
      link,
      expiresAt,
      createdBy: req.user._id,
    });

    res.status(201).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

const getAllAnnouncements = async (req, res, next) => {
  try {
    const announcements = await announcementModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, announcements });
  } catch (error) {
    next(error);
  }
};

const updateAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { durationInHours, ...rest } = req.body;
    const allowedFields = ["title", "message", "type", "targetAudience", "link", "isActive"];

    const updates = {};
    allowedFields.forEach((field) => {
      if (rest[field] !== undefined) updates[field] = rest[field];
    });

    if (durationInHours !== undefined) {
      if (durationInHours === null) {
        updates.expiresAt = null; // never expires
      } else {
        if (durationInHours <= 0) {
          return next(new AppError("Duration in hours must be greater than 0", 400));
        }
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + Number(durationInHours));
        updates.expiresAt = expiresAt;
      }
    }

    const announcement = await announcementModel.findByIdAndUpdate(id, updates, { new: true });

    if (!announcement) {
      return next(new AppError("Announcement not found", 404));
    }

    res.status(200).json({ success: true, announcement });
  } catch (error) {
    next(error);
  }
};

const deleteAnnouncement = async (req, res, next) => {
  try {
    const { id } = req.params;
    const announcement = await announcementModel.findByIdAndDelete(id);

    if (!announcement) {
      throw new AppError("Announcement not found", 404);
    }

    res.status(200).json({ success: true, message: "Announcement deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = { createAnnouncement, getAllAnnouncements, updateAnnouncement, deleteAnnouncement };