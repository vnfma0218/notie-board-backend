const Axios = require('axios');
const express = require('express');
const generateTokens = require('../utils/generateTokens');
const { authenticateToken } = require('../middleware/authenticationToken');

require('dotenv').config();
const User = require('../models/user');

const router = express.Router();

// 소셜로그인 리다이렉트 url
router.get('/auth/kakao', async (req, res) => {
  const code = req.query.code;
  console.log('code', code);
  console.log('process.env.KAKAO_RESTAPIKEY', process.env.KAKAO_RESTAPIKEY);
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

module.exports = router;
