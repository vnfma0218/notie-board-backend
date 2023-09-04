const express = require('express');

const User = require('../models/user');
const Post = require('../models/post');
const Activity = require('../models/activity');

const router = express.Router();
const { authenticateToken } = require('../middleware/authenticationToken');

// 최근 활동 목록
router.get('/activities', authenticateToken, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const activities = await Activity.find({ user }).populate({
    path: 'post',
    select: 'title',
  });

  return res.status(200).json(activities);
});

module.exports = router;
