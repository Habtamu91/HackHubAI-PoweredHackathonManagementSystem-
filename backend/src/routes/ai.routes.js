const express = require("express");
const Hackathon = require("../models/Hackathon");
const Submission = require("../models/Submission");
const Team = require("../models/Team");
const asyncHandler = require("../utils/asyncHandler");
const { ok } = require("../utils/apiResponse");
const { protect, authorize } = require("../middleware/auth");
const { callAi, localEvaluation } = require("../services/aiService");

const router = express.Router();

router.post(
  "/team-match",
  protect,
  authorize("participant", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.findById(req.body.hackathonId).populate(
      "participants.user",
      "name skills"
    );
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    const existingTeams = await Team.find({ hackathon: hackathon._id }).populate("members.user", "skills");
    const assignedUserIds = new Set(
      existingTeams.flatMap((team) => team.members.map((member) => String(member.user._id)))
    );
    const candidates = hackathon.participants
      .map((participant) => participant.user)
      .filter((user) => user && String(user._id) !== String(req.user._id) && !assignedUserIds.has(String(user._id)));

    let matches;
    try {
      matches = await callAi("/team-match", {
        requester: { id: req.user._id, skills: req.user.skills },
        candidates,
        teamSettings: hackathon.teamSettings
      });
    } catch (error) {
      const requesterSkills = new Set(req.user.skills || []);
      matches = {
        recommendations: candidates.slice(0, 10).map((candidate) => {
          const overlap = candidate.skills.filter((skill) => requesterSkills.has(skill)).length;
          const complementary = candidate.skills.length - overlap;
          return {
            users: [candidate],
            aiMatchScore: Math.min(100, 60 + overlap * 8 + complementary * 3),
            rationale: "Local skill-overlap recommendation"
          };
        })
      };
    }
    ok(res, matches, "Team matches generated");
  })
);

router.post(
  "/evaluate/:submissionId",
  protect,
  authorize("organizer", "judge", "admin"),
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.submissionId).populate("hackathon");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    let evaluation;
    try {
      evaluation = await callAi("/evaluate", {
        projectTitle: submission.projectTitle,
        description: submission.description,
        githubUrl: submission.githubUrl,
        techStack: submission.techStack
      });
    } catch (error) {
      evaluation = localEvaluation(submission);
    }
    submission.aiEvaluation = evaluation;
    await submission.save();
    ok(res, submission.aiEvaluation, "AI evaluation completed");
  })
);

router.get(
  "/evaluation/:submissionId",
  protect,
  authorize("organizer", "judge", "admin"),
  asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.submissionId).select("aiEvaluation");
    if (!submission) return res.status(404).json({ success: false, message: "Submission not found" });
    ok(res, submission.aiEvaluation || null);
  })
);

router.post(
  "/similarity/:hackathonId",
  protect,
  authorize("organizer", "admin"),
  asyncHandler(async (req, res) => {
    const submissions = await Submission.find({
      hackathon: req.params.hackathonId,
      status: { $in: ["submitted", "under_review", "accepted"] }
    }).select("projectTitle description techStack");
    let result;
    try {
      result = await callAi("/similarity", { submissions });
    } catch (error) {
      result = { flags: [] };
      for (let i = 0; i < submissions.length; i += 1) {
        for (let j = i + 1; j < submissions.length; j += 1) {
          const a = new Set(submissions[i].description.toLowerCase().split(/\W+/));
          const b = new Set(submissions[j].description.toLowerCase().split(/\W+/));
          const intersection = [...a].filter((word) => b.has(word)).length;
          const similarity = intersection / Math.max(1, Math.sqrt(a.size * b.size));
          if (similarity >= 0.7) {
            result.flags.push({
              sourceSubmissionId: submissions[i]._id,
              targetSubmissionId: submissions[j]._id,
              similarity
            });
          }
        }
      }
    }
    ok(res, result, "Similarity analysis completed");
  })
);

module.exports = router;
