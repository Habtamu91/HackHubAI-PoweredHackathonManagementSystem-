const express = require("express");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const { created, ok } = require("../utils/apiResponse");
const { protect, authorize } = require("../middleware/auth");
const { notifyUser } = require("../services/notificationService");
const { emitToUser } = require("../services/socketService");

const router = express.Router();

function isMember(team, userId) {
  return team.members.some((member) => String(member.user._id || member.user) === String(userId));
}

function requireLeader(req, team) {
  if (req.user.role !== "admin" && String(team.leader) !== String(req.user._id)) {
    const error = new Error("Only the team leader can perform this action");
    error.statusCode = 403;
    throw error;
  }
}

router.post(
  "/",
  protect,
  authorize("participant", "admin"),
  asyncHandler(async (req, res) => {
    const hackathon = await Hackathon.findById(req.body.hackathonId);
    if (!hackathon) return res.status(404).json({ success: false, message: "Hackathon not found" });
    const team = await Team.create({
      name: req.body.name,
      hackathon: hackathon._id,
      leader: req.user._id,
      members: [{ user: req.user._id, role: "leader" }],
      lookingForSkills: req.body.lookingForSkills || [],
      status: hackathon.teamSettings.allowSolo ? "active" : "forming"
    });
    hackathon.stats.teams += 1;
    await hackathon.save();
    created(res, team, "Team created");
  })
);

router.get(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id)
      .populate("members.user", "name email skills avatar")
      .populate("leader", "name email")
      .populate("hackathon", "title slug teamSettings submissionDeadline");
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (req.user.role !== "admin" && !isMember(team, req.user._id)) {
      return res.status(403).json({ success: false, message: "Team access denied" });
    }
    ok(res, team);
  })
);

router.put(
  "/:id",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    requireLeader(req, team);
    Object.assign(team, {
      name: req.body.name ?? team.name,
      lookingForSkills: req.body.lookingForSkills ?? team.lookingForSkills,
      status: req.body.status ?? team.status
    });
    await team.save();
    ok(res, team, "Team updated");
  })
);

router.post(
  "/:id/invite",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id).populate("hackathon", "teamSettings title");
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    requireLeader(req, team);
    const user = await User.findById(req.body.userId);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (team.members.length >= team.hackathon.teamSettings.maxSize) {
      return res.status(400).json({ success: false, message: "Team is already full" });
    }
    team.invitations.push({
      user: user._id,
      message: req.body.message,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    });
    await team.save();
    const payload = { teamId: team._id, teamName: team.name, hackathonTitle: team.hackathon.title };
    emitToUser(user._id.toString(), "team:invite", payload);
    await notifyUser({
      recipient: user._id,
      type: "team:invite",
      title: "Team invitation",
      message: `${team.name} invited you to join.`,
      link: `/teams/${team._id}`,
      metadata: payload
    });
    ok(res, team, "Invitation sent");
  })
);

router.post(
  "/:id/request",
  protect,
  authorize("participant", "admin"),
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (!team.joinRequests.some((request) => String(request.user) === String(req.user._id))) {
      team.joinRequests.push({ user: req.user._id, message: req.body.message });
      await team.save();
      emitToUser(team.leader.toString(), "team:join_request", {
        teamId: team._id,
        requesterId: req.user._id
      });
    }
    ok(res, team, "Join request sent");
  })
);

router.patch(
  "/:id/requests/:requestId",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    requireLeader(req, team);
    const request = team.joinRequests.id(req.params.requestId);
    if (!request) return res.status(404).json({ success: false, message: "Request not found" });
    request.status = req.body.status;
    request.resolvedAt = new Date();
    if (req.body.status === "accepted" && !isMember(team, request.user)) {
      team.members.push({ user: request.user });
      team.status = "active";
    }
    await team.save();
    emitToUser(request.user.toString(), "team:request_resolved", {
      teamId: team._id,
      status: request.status
    });
    ok(res, team, "Request resolved");
  })
);

router.patch(
  "/invitations/:inviteId",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findOne({ "invitations._id": req.params.inviteId });
    if (!team) return res.status(404).json({ success: false, message: "Invitation not found" });
    const invite = team.invitations.id(req.params.inviteId);
    if (String(invite.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: "Invitation access denied" });
    }
    invite.status = req.body.status;
    invite.resolvedAt = new Date();
    if (req.body.status === "accepted" && !isMember(team, req.user._id)) {
      team.members.push({ user: req.user._id });
      team.status = "active";
    }
    await team.save();
    ok(res, team, "Invitation resolved");
  })
);

router.delete(
  "/:id/members/:userId",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    requireLeader(req, team);
    team.members = team.members.filter((member) => String(member.user) !== req.params.userId);
    await team.save();
    ok(res, team, "Member removed");
  })
);

router.delete(
  "/:id/leave",
  protect,
  asyncHandler(async (req, res) => {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ success: false, message: "Team not found" });
    if (String(team.leader) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: "Transfer leadership before leaving" });
    }
    team.members = team.members.filter((member) => String(member.user) !== String(req.user._id));
    await team.save();
    ok(res, team, "Left team");
  })
);

module.exports = router;
