const express = require("express");
const Certificate = require("../models/Certificate");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const { protect, authorize } = require("../middleware/auth");
const { generateCertificate } = require("../services/certificateService");

const router = express.Router();

router.get(
  "/:verificationId",
  asyncHandler(async (req, res) => {
    const certificate = await Certificate.findOne({ verificationId: req.params.verificationId })
      .populate("user", "name")
      .populate("hackathon", "title")
      .populate("team", "name");
    if (!certificate) {
      return res.status(404).json({ success: false, message: "Certificate not found" });
    }
    ok(res, certificate);
  })
);

router.post(
  "/generate",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.findById(req.body.hackathonId);
    const team = req.body.teamId ? await Team.findById(req.body.teamId).populate("members.user") : null;
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    if (req.user.role !== "admin" && String(hackathon.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only organizer can generate certificates" });
    }
    const recipients = team ? team.members.map((member) => member.user) : [];
    const certificates = await Promise.all(
      recipients.map((user) => generateCertificate({ user, hackathon, team, rank: team?.rank }))
    );
    ok(res, certificates, "Certificates generated");
  })
);

module.exports = router;
