const express = require("express");
const mongoose = require("mongoose");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const Submission = require("../models/Submission");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { created, ok, paginated } = require("../utils/apiResponse");
const { protect, optionalAuth, authorize } = require("../middleware/auth");
const { emitToHackathon } = require("../services/socketService");
const { notifyUser } = require("../services/notificationService");

const router = express.Router();

async function findHackathon(identifier) {
  const query = mongoose.isValidObjectId(identifier) ? { _id: identifier } : { slug: identifier };
  return Hackathon.findOne(query);
}

function requireOwner(req, hackathon) {
  if (
    req.user.role !== "admin" &&
    String(hackathon.organizer) !== String(req.user._id)
  ) {
    const error = new Error("Only the organizer can manage this hackathon");
    error.statusCode = 403;
    throw error;
  }
}

router.get(
  "/",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 12), 1), 50);
    const filter = {};
    if (!req.user || req.user.role === "participant") {
      filter.status = { $ne: "draft" };
    }
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) filter.$text = { $search: req.query.search };

    const [items, total] = await Promise.all([
      Hackathon.find(filter)
        .populate("organizer", "name email")
        .sort({ startDate: 1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Hackathon.countDocuments(filter)
    ]);

    paginated(res, items, { page, limit, total, pages: Math.ceil(total / limit) });
  })
);

router.post(
  "/",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.create({
      ...req.body,
      organizer: req.user._id
    });
    created(res, hackathon, "Hackathon created");
  })
);

router.get(
  "/:id",
  optionalAuth,
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    ok(res, hackathon);
  })
);

router.put(
  "/:id",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    Object.assign(hackathon, req.body);
    await hackathon.save();
    ok(res, hackathon, "Hackathon updated");
  })
);

router.delete(
  "/:id",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    await Promise.all([
      Submission.deleteMany({ hackathon: hackathon._id }),
      Team.deleteMany({ hackathon: hackathon._id }),
      Hackathon.deleteOne({ _id: hackathon._id })
    ]);
    ok(res, null, "Hackathon deleted");
  })
);

router.post(
  "/:id/register",
  protect,
  authorize("participant", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    if (hackathon.participants.some((item) => String(item.user) === String(req.user._id))) {
      return ok(res, hackathon, "Already registered");
    }
    hackathon.participants.push({ user: req.user._id });
    hackathon.stats.participants = hackathon.participants.length;
    await hackathon.save();
    await User.findByIdAndUpdate(req.user._id, { $inc: { "stats.hackathonsJoined": 1 } });
    ok(res, hackathon, "Registered for hackathon");
  })
);

router.post(
  "/:id/publish",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    hackathon.status = "published";
    await hackathon.save();
    ok(res, hackathon, "Hackathon published");
  })
);

router.post(
  "/:id/judges",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    const judge = await User.findById(req.body.userId);
    if (!judge || judge.role !== "judge") {
      return res.status(400).json({ success: false, message: "A judge user is required" });
    }
    if (!hackathon.judges.some((item) => String(item.user) === String(judge._id))) {
      hackathon.judges.push({ user: judge._id });
      await hackathon.save();
      await notifyUser({
        recipient: judge._id,
        type: "judge:assigned",
        title: "New judging assignment",
        message: `You were assigned to judge ${hackathon.title}.`,
        link: `/judge/${hackathon._id}`
      });
    }
    ok(res, hackathon, "Judge assigned");
  })
);

router.delete(
  "/:id/judges/:userId",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    hackathon.judges = hackathon.judges.filter((judge) => String(judge.user) !== req.params.userId);
    await hackathon.save();
    ok(res, hackathon, "Judge removed");
  })
);

router.post(
  "/:id/announce",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    requireOwner(req, hackathon);
    const payload = {
      title: req.body.title || "Hackathon announcement",
      message: req.body.message,
      hackathonId: hackathon._id
    };
    emitToHackathon(hackathon._id.toString(), "hackathon:announcement", payload);
    await Promise.all(
      hackathon.participants.map((participant) =>
        notifyUser({
          recipient: participant.user,
          type: "hackathon:announcement",
          title: payload.title,
          message: payload.message,
          link: `/hackathons/${hackathon.slug}`
        })
      )
    );
    ok(res, payload, "Announcement sent");
  })
);

router.get(
  "/:id/submissions",
  protect,
  authorize("organizer", "judge", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await findHackathon(req.params.id);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    const isJudge = hackathon.judges.some((judge) => String(judge.user) === String(req.user._id));
    if (req.user.role === "judge" && !isJudge) {
      return res.status(403).json({ success: false, message: "Judge is not assigned" });
    }
    if (req.user.role === "organizer") requireOwner(req, hackathon);
    const submissions = await Submission.find({ hackathon: hackathon._id })
      .populate("team", "name")
      .populate("submittedBy", "name");
    ok(res, submissions);
  })
);

module.exports = router;
