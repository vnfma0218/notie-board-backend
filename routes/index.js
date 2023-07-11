const express = require('express');
const router = express.Router();
const User = require('../models/user');

router.get('/', async (req, res, next) => {
  try {
    res.json('hello');
    // res.render('mongoose', { users });
  } catch (err) {
    console.error(err);
    next(err);
  }
});
router.post('/login', async (req, res, next) => {
  console.log(req.body);
  const email = req.body.email;
  const existingUser = await User.findOne({ email });
  if (!existingUser) {
    return res.status(403).json({ message: '아이디 혹은 비밀번호 확인' });
  }
  console.log('existingUser', existingUser);
  res.status(200).json({ message: '아직 대기해봐', user: existingUser });
});
router.post('/signup', async (req, res, next) => {
  console.log(req.body);
  const email = req.body.email;
  const password = req.body.password;

  const existingUser = User.findOne({ email });
  if (existingUser) {
    return res.status(403).json({ message: '이미 존재하는 유저입니다.' });
  }

  const user = await User.create({
    email,
    password,
  });

  res.status(200).json({ message: '성공', user });
});

module.exports = router;
