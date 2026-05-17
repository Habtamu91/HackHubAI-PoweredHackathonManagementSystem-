const nodemailer = require("nodemailer");
const env = require("../config/env");

function createTransporter() {
  if (!process.env.EMAIL_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }

  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT || 587),
    secure: process.env.EMAIL_PORT === "465",
    auth:
      process.env.EMAIL_USER && process.env.EMAIL_PASS
        ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
        : undefined
  });
}

async function sendEmail({ to, subject, html, text }) {
  const transporter = createTransporter();
  return transporter.sendMail({
    from: env.emailFrom,
    to,
    subject,
    html,
    text
  });
}

function verificationEmail({ name, url }) {
  return {
    subject: "Verify your HackHub account",
    html: `<p>Hi ${name},</p><p>Verify your HackHub account by opening <a href="${url}">this link</a>.</p>`,
    text: `Hi ${name}, verify your HackHub account: ${url}`
  };
}

module.exports = { sendEmail, verificationEmail };
