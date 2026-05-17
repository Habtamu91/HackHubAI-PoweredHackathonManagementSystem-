const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const Certificate = require("../models/Certificate");
const { randomToken } = require("../utils/tokens");

async function generateCertificate({ user, hackathon, team, rank }) {
  const verificationId = `HH-${randomToken().slice(0, 12).toUpperCase()}`;
  const directory = path.join(process.cwd(), "certificates");
  await fs.promises.mkdir(directory, { recursive: true });
  const filename = `${verificationId}.pdf`;
  const filePath = path.join(directory, filename);

  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", layout: "landscape" });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    doc.fontSize(34).text("HackHub Certificate", { align: "center" });
    doc.moveDown();
    doc.fontSize(22).text("Presented to", { align: "center" });
    doc.fontSize(32).text(user.name, { align: "center" });
    doc.moveDown();
    doc
      .fontSize(18)
      .text(`For participating in ${hackathon.title}${rank ? ` and ranking #${rank}` : ""}.`, {
        align: "center"
      });
    if (team) doc.text(`Team: ${team.name}`, { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Verification ID: ${verificationId}`, { align: "center" });
    doc.end();
    stream.on("finish", resolve);
    stream.on("error", reject);
  });

  return Certificate.create({
    verificationId,
    user: user._id,
    hackathon: hackathon._id,
    team: team?._id,
    rank,
    pdfUrl: `/certificates/${filename}`
  });
}

module.exports = { generateCertificate };
