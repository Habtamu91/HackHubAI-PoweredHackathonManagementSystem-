const Notification = require("../models/Notification");
const { emitToUser } = require("./socketService");

async function notifyUser({ recipient, type, title, message, link, metadata }) {
  const notification = await Notification.create({
    recipient,
    type,
    title,
    message,
    link,
    metadata
  });

  emitToUser(recipient.toString(), "notification", notification);
  return notification;
}

module.exports = { notifyUser };
