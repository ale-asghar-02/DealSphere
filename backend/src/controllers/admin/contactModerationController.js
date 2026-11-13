const contactModel = require('../../models/contactModel');
const AppError = require("../../utils/AppError");
const { contactReplyTemplate, sendEmail } = require('../../utils/mailor');
const { sendNotification } = require("../../socket/notificationSocket");

const getAllContacts = async (req, res, next) => {
  try {
    const contactList = await contactModel
      .find({ isDeleted: false })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: contactList,
    });
  } catch (error) {
    next(error);
  }
};

const getContactById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await contactModel.findOne({ _id: id, isDeleted: false });
    if (!contact) return next(new AppError("Contact message not found", 404));

    res.status(200).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

const replyToContact = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    if (!reply || reply.trim().length < 5) {
      return next(new AppError("Reply message is required (min 5 characters)", 400));
    }

    const contact = await contactModel.findById(id);
    if (!contact) return next(new AppError("Contact message not found", 404));

    contact.adminReply = reply;
    contact.repliedBy = req.user.id;
    contact.repliedAt = new Date();
    contact.status = "resolved";
    await contact.save();

    const template = contactReplyTemplate(contact.name, contact.subject, contact.message, reply);
    await sendEmail(contact.email, template);

    if (contact.user) {
      await sendNotification({
        userId: contact.user,
        type: "contact",
        title: "Your message has been replied to",
        message: reply,
        metadata: { action: "contact-reply", contactId: contact._id },
      });
    }

    res.status(200).json({
      success: true,
      message: "Reply sent successfully",
      data: contact,
    });
  } catch (error) {
    next(error);
  }
};

const deleteContact = async (req, res, next) => {
  try {
    const { id } = req.params;

    const contact = await contactModel.findOne({ _id: id, isDeleted: false });
    if (!contact) return next(new AppError("Contact message not found", 404));

    contact.isDeleted = true;
    await contact.save();

    res.status(200).json({ success: true, message: "Contact message deleted" });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllContacts,
  getContactById,
  replyToContact,
  deleteContact,
};