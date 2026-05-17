const express = require("express");
const Notification = require("../models/Notification");
const asyncHandler = require("../utils/asyncHandler");
const { ok, paginated } = require("../utils/apiResponse");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get(
  "/",
  protect,
  asyncHandler(async (req, res) => {
    const page = Math.max(Number(req.query.page || 1), 1);
    const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 50);
    const [items, total, unread] = await Promise.all([
      Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments({ recipient: req.user._id }),
      Notification.countDocuments({ recipient: req.user._id, readAt: null })
    ]);
    paginated(res, items, { page, limit, total, pages: Math.ceil(total / limit), unread });
  })
);

router.patch(
  "/:id/read",
  protect,
  asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user._id },
      { readAt: new Date() },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: "Notification not found" });
    }
    ok(res, notification, "Notification marked read");
  })
);

module.exports = router;
