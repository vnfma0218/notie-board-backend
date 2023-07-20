const path = require('path');

const Axios = require('axios');
const User = require('../models/user');
const express = require('express');
const generateTokens = require('../utils/generateTokens');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const multer = require('multer');
// Define the storage for uploaded files
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

const { authenticateToken } = require('../middleware/authenticationToken');

require('dotenv').config();

const router = express.Router();

// 소셜로그인
router.get('/auth/kakao', async (req, res) => {
  const code = req.query.code;
  try {
    // Access token 가져오기
    const res1 = await Axios.post(
      'https://kauth.kakao.com/oauth/token',
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        params: {
          grant_type: 'authorization_code',
          client_id: process.env.KAKAO_RESTAPIKEY,
          code,
          redirect_uri: 'http://localhost:8080/user/auth/kakao',
          client_secret: process.env.KAKAO_SECRET_KEY,
        },
      }
    );
    // Access token을 이용해 정보 가져오기
    const res2 = await Axios.post(
      'https://kapi.kakao.com/v2/user/me',
      {},
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: 'Bearer ' + res1.data.access_token,
        },
      }
    );
    const email = res2.data.kakao_account.email;
    // 소셜로그인 정보를 바탕으로 회원 가입을 진행
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // 회원 DB에 저장
      await User.create({
        email,
        snsType: 'kakao',
        nickname: res2.data.kakao_account.profile.nickname,
      });
    }
    const { accessToken, refreshToken } = await generateTokens(email);
    res.cookie(`accessToken`, accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
    res.redirect('http://localhost:3000');
    // res.status(200).json({ message: 'success login' });

    console.log('accessToken', accessToken);
  } catch (e) {
    console.log(e);
    res.status(400).end('Sorry, Login Error!');
  }
});

router.get('/isLoggedIn', authenticateToken, async (req, res) => {
  if (req.user.email) {
    res.status(200).json({ isLoggedIn: true });
  } else {
    res.status(200).json({ isLoggedIn: false });
  }
});
router.get('/logout', async (req, res) => {
  res.clearCookie('accessToken');
  res.status(200).json({ message: 'success' });
});
router.post('/signup', async (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const nickname = req.body.nickname;

  // 닉네임 email 중복체크
  const existingUser = await User.findOne({
    $or: [{ email }, { nickname }],
  });
  if (existingUser) {
    // 409 conflict 리소스 충돌 의미
    return res.status(409).json({
      resultCode: 4009,
      message: '중복된 이메일 혹은 닉네임이 존재합니다.',
    });
  }

  bcrypt.genSalt(saltRounds, function (err, salt) {
    if (err) return res.status(403);
    bcrypt.hash(password, salt, function (err, hashedPassword) {
      // hash의 첫번째 인자: 비밀번호의 Plain Text
      if (err) return res.status(403);
      console.log('hashedPassword', hashedPassword);
      User.create({ email, password: hashedPassword, nickname }).then(() => {
        res.status(200).json({ resultCode: 2000, message: 'success' });
      });
    });
  });
});

// 로그인
router.post('/login', async (req, res) => {
  console.log('login~~~~~~~~!!!!');
  const email = req.body.email;
  const password = req.body.password;

  let isPasswordMatched = false;
  const user = await User.findOne({ email });
  if (user) {
    isPasswordMatched = await bcrypt.compare(password, user.password);
  }

  if (!user || !isPasswordMatched) {
    return res.status(200).json({
      resultCode: 4004,
      dmessage: '이메일 혹은 패스워드를 다시 확인해주세요',
    });
  } else {
    const { accessToken } = await generateTokens(email);
    res.cookie(`accessToken`, accessToken, {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
    });
    return res.status(200).json({ message: 'success' });
  }
});

// 프로필 변경
router.put(
  '/profile',
  authenticateToken,
  upload.single('file'),
  async (req, res) => {
    const user = await User.findOne({ email: req.user.email });
    const nickname = req.body.nickname;
    const fileData = req.file;
    user.avatar = {
      filename: fileData.filename,
      path: fileData.path,
    };
    user.nickname = nickname;
    await user.save();
    return res.status(200).json({ message: 'success' });
  }
);
// 프로필 get
router.get('/profile', authenticateToken, async (req, res) => {
  const user = await User.findOne({ email: req.user.email });
  const filename = user.avatar.filename;
  console.log('filename', filename);
  const fileUrl =
    req.protocol + '://' + req.get('host') + '/uploads/' + filename;
  return res
    .status(200)
    .json({
      avatar: filename ? fileUrl : null,
      nickname: user.nickname,
      email: user.email,
    });
});

module.exports = router;
