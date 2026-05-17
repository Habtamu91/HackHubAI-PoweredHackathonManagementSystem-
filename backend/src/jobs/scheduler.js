const cron = require("node-cron");
const Hackathon = require("../models/Hackathon");
const Team = require("../models/Team");
const { notifyUser } = require("../services/notificationService");

async function updateHackathonStatuses() {
  const now = new Date();
  const hackathons = await Hackathon.find({
    status: { $in: ["published", "registration_open", "ongoing", "judging"] }
  });

  await Promise.all(
    hackathons.map(async (hackathon) => {
      let nextStatus = hackathon.status;
      if (now >= hackathon.endDate) {
        nextStatus = "completed";
      } else if (now >= hackathon.submissionDeadline) {
        nextStatus = "judging";
      } else if (now >= hackathon.startDate) {
        nextStatus = "ongoing";
      } else if (now >= hackathon.registrationStart && now < hackathon.registrationEnd) {
        nextStatus = "registration_open";
      }

      if (nextStatus !== hackathon.status) {
        hackathon.status = nextStatus;
        await hackathon.save();
      }
    })
  );
}

async function expireInvitations() {
  await Team.updateMany(
    { "invitations.status": "pending", "invitations.expiresAt": { $lt: new Date() } },
    { $set: { "invitations.$[invite].status": "expired" } },
    { arrayFilters: [{ "invite.status": "pending", "invite.expiresAt": { $lt: new Date() } }] }
  );
}

async function warnDeadlines() {
  const now = new Date();
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
  const hackathons = await Hackathon.find({
    submissionDeadline: { $gte: now, $lte: oneHourFromNow },
    status: { $in: ["ongoing", "judging"] }
  });

  for (const hackathon of hackathons) {
    const teams = await Team.find({ hackathon: hackathon._id, submission: { $exists: false } });
    await Promise.all(
      teams.flatMap((team) =>
        team.members.map((member) =>
          notifyUser({
            recipient: member.user,
            type: "submission:deadline_warning",
            title: "Submission deadline approaching",
            message: `${hackathon.title} submissions close in about one hour.`,
            link: `/submit/${hackathon._id}`
          })
        )
      )
    );
  }
}

function startScheduler() {
  cron.schedule("*/5 * * * *", updateHackathonStatuses);
  cron.schedule("*/30 * * * *", warnDeadlines);
  cron.schedule("0 1 * * *", expireInvitations);
}

module.exports = { startScheduler, updateHackathonStatuses, expireInvitations, warnDeadlines };
