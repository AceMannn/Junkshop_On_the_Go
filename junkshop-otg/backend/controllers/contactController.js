const ContactMessage = require('../models/ContactMessage');
const { validateContactPayload } = require('../utils/contactValidation');

exports.submitContactMessage = async (req, res) => {
  try {
    const validation = validateContactPayload(req.body);
    if (!validation.ok) {
      return res.status(400).json({ message: validation.message });
    }

    const contactMessage = await ContactMessage.create(validation.data);

    res.status(201).json({
      message: 'Message received. We will get back to you soon.',
      contactMessage: {
        id: contactMessage._id,
        name: contactMessage.name,
        email: contactMessage.email,
        subject: contactMessage.subject,
        status: contactMessage.status,
        createdAt: contactMessage.createdAt,
      },
    });
  } catch (error) {
    console.error('submitContactMessage', error);
    res.status(500).json({ message: 'Could not send your message. Please try again.' });
  }
};
