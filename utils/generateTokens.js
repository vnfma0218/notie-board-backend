const jwt = require('jsonwebtoken');
// import UserToken from '../models/UserToken.js';

const generateTokens = async (email) => {
  try {
    const payload = { email };
    const accessToken = jwt.sign(
      payload,
      process.env.ACCESS_TOKEN_PRIVATE_KEY,
      { expiresIn: '1m' }
    );
    const refreshToken = jwt.sign(
      payload,
      process.env.REFRESH_TOKEN_PRIVATE_KEY,
      { expiresIn: '30d' }
    );

    return Promise.resolve({ accessToken, refreshToken });
  } catch (err) {
    return Promise.reject(err);
  }
};

module.exports = generateTokens;
