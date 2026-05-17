const express = require("express");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const asyncHandler = require("../utils/asyncHandler");
const { created, ok } = require("../utils/apiResponse");
const { protect } = require("../middleware/auth");

const router = express.Router();

function canManageTeam(team, userId) {
  return team.members.some((member) => String(member.user) === String(userId));
}

router.post(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.body.teamId).populate("hackathon");
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (req.user.role !== "admin" && !canManageTeam(team, req.user._id)) {
      return res.status(403).json({ success: false, message: "Team membership required" });
    }
    if (new Date() > team.hackathon.submissionDeadline) {
      return res.status(400).json({ success: false, message: "Submission deadline has passed" });
    }

    const submission = await Submission.create({
      ...req.body,
      team: team._id,
      hackathon: team.hackathon._id,
      submittedBy: req.user._id,
      status: req.body.status === "submitted" ? "submitted" : "draft",
      submittedAt: req.body.status === "submitted" ? new Date() : undefined
    });
    team.submission = submission._id;
    if (submission.status === "submitted") team.status = "submitted";
    await team.save();
    await Hackathon.findByIdAndUpdate(team.hackathon._id, { $inc: { "stats.submissions": 1 } });
    created(res, submission, "Submission created");
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
      .populate("team", "name members leader")
      .populate("hackathon", "title slug organizer judges resultsPublishedAt");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    const memberIds = submission.team.members.map((member) => String(member.user));
    const organizer = String(submission.hackathon.organizer) === String(req.user._id);
    const judge = submission.hackathon.judges.some((item) => String(item.user) === String(req.user._id));
    if (
      req.user.role !== "admin" &&
      !memberIds.includes(String(req.user._id)) &&
      !organizer &&
      !judge
    ) {
      return res.status(403).json({ success: false, message: "Submission access denied" });
    }
    ok(res, submission);
  })
);

router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id).populate("team").populate("hackathon");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    if (!canManageTeam(submission.team, req.user._id)) {
      return res.status(403).json({ success: false, message: "Team membership required" });
    }
    if (submission.status !== "draft" || new Date() > submission.hackathon.submissionDeadline) {
      return res.status(400).json({ success: false, message: "Submitted projects are locked" });
    }
    Object.assign(submission, {
      projectTitle: req.body.projectTitle ?? submission.projectTitle,
      description: req.body.description ?? submission.description,
      githubUrl: req.body.githubUrl ?? submission.githubUrl,
      demoUrl: req.body.demoUrl ?? submission.demoUrl,
      videoUrl: req.body.videoUrl ?? submission.videoUrl,
      techStack: req.body.techStack ?? submission.techStack,
      screenshots: req.body.screenshots ?? submission.screenshots
    });
    await submission.save();
    ok(res, submission, "Submission updated");
  })
);

router.patch(
  "/:id/submit",
  protect,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id).populate("team").populate("hackathon");
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    if (!canManageTeam(submission.team, req.user._id)) {
      return res.status(403).json({ success: false, message: "Team membership required" });
    }
    if (new Date() > submission.hackathon.submissionDeadline) {
      return res.status(400).json({ success: false, message: "Submission deadline has passed" });
    }
    submission.status = "submitted";
    submission.submittedAt = new Date();
    submission.team.status = "submitted";
    await Promise.all([submission.save(), submission.team.save()]);
    ok(res, submission, "Submission finalized");
  })
);

router.post(
  "/:id/like",
  protect,
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    const existing = submission.likes.findIndex((id) => String(id) === String(req.user._id));
    if (existing >= 0) submission.likes.splice(existing, 1);
    else submission.likes.push(req.user._id);
    await submission.save();
    ok(res, { likes: submission.likes.length }, "Like toggled");
  })
);

module.exports = router;
