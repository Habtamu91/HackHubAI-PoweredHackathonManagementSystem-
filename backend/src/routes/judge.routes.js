const express = require("express");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const { protect, authorize } = require("../middleware/auth");
const { emitToHackathon } = require("../services/socketService");

const router = express.Router();

function isAssignedJudge(hackathon, userId) {
  return hackathon.judges.some((judge) => String(judge.user) === String(userId));
}

router.get(
  "/assignments",
  protect,
  authorize("judge", "admin"),
  asyncHandler(async (req, res) => {
    const filter = req.user.role === "admin" ? {} : { "judges.user": req.user._id };
    const hackathons = await Hackathon.find(filter).sort({ startDate: -1 });
    ok(res, hackathons);
  })
);

router.get(
  "/:hackathonId/submissions",
  protect,
  authorize("judge", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    if (req.user.role !== "admin" && !isAssignedJudge(hackathon, req.user._id)) {
      return res.status(403).json({ success: false, message: "Judge is not assigned" });
    }
    const submissions = await Submission.find({
      hackathon: hackathon._id,
      status: { $in: ["submitted", "under_review", "accepted"] }
    }).populate("team", "name");
    ok(res, submissions);
  })
);

router.post(
  "/score",
  protect,
  authorize("judge", "admin"),
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.body.submissionId).populate("hackathon");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    if (req.user.role !== "admin" && !isAssignedJudge(submission.hackathon, req.user._id)) {
      return res.status(403).json({ success: false, message: "Judge is not assigned" });
    }

    const criteria = req.body.criteria || [];
    const totalScore = criteria.reduce((sum, criterion) => {
      const normalized = (criterion.score / criterion.maxScore) * 100;
      return sum + normalized * criterion.weight;
    }, 0);
    const existing = submission.scores.find((score) => String(score.judge) === String(req.user._id));
    if (existing?.isFinalized) {
      return res.status(400).json({ success: false, message: "Finalized scores are locked" });
    }
    if (existing) {
      existing.criteria = criteria;
      existing.totalScore = Math.round(totalScore);
      existing.feedback = req.body.feedback;
    } else {
      submission.scores.push({
        judge: req.user._id,
        criteria,
        totalScore: Math.round(totalScore),
        feedback: req.body.feedback
      });
    }
    submission.status = "under_review";
    await submission.save();
    ok(res, submission, "Score saved");
  })
);

router.patch(
  "/score/:scoreId/finalize",
  protect,
  authorize("judge", "admin"),
  asyncHandler(async (req, res) => {
    const submission = await Submission.findOne({ "scores._id": req.params.scoreId });
    if (!submission) return res.status(404).json({ success: false, message: "Score not found" });
    const score = submission.scores.id(req.params.scoreId);
    if (req.user.role !== "admin" && String(score.judge) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Score access denied" });
    }
    score.isFinalized = true;
    score.finalizedAt = new Date();
    submission.recalculateFinalScore();
    await submission.save();
    ok(res, submission, "Score finalized");
  })
);

router.get(
  "/:hackathonId/leaderboard",
  protect,
  authorize("judge", "organizer", "admin"),
  asyncHandler(async (req, res) => {
    const submissions = await Submission.find({
      hackathon: req.params.hackathonId,
      finalScore: { $exists: true, $ne: null }
    })
      .populate("team", "name")
      .sort({ finalScore: -1 });
    ok(
      res,
      submissions.map((submission, index) => ({
        rank: index + 1,
        submissionId: submission._id,
        projectTitle: submission.projectTitle,
        team: submission.team,
        finalScore: submission.finalScore
      }))
    );
  })
);

router.post(
  "/:hackathonId/publish-results",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.findById(req.params.hackathonId);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    if (req.user.role !== "admin" && String(hackathon.organizer) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Only organizer can publish results" });
    }

    const submissions = await Submission.find({
      hackathon: hackathon._id,
      finalScore: { $exists: true, $ne: null }
    })
      .sort({ finalScore: -1 })
      .populate("team");
    await Promise.all(
      submissions.map(async (submission, index) => {
        submission.rank = index + 1;
        submission.status = "accepted";
        if (submission.team) {
          await Team.findByIdAndUpdate(submission.team._id, {
            finalScore: submission.finalScore,
            rank: submission.rank
          });
        }
        return submission.save();
      })
    );
    hackathon.status = "completed";
    hackathon.resultsPublishedAt = new Date();
    await hackathon.save();
    emitToHackathon(hackathon._id.toString(), "results:published", { hackathonId: hackathon._id });
    ok(res, submissions, "Results published");
  })
);

module.exports = router;
