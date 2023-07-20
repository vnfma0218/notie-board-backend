const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  console.log('token', token);
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY, (err, user) => {
    console.log('token', token);
    console.log('err', err);
    if (err) return res.sendStatus(403);
    req.user = user;

    next();
  });
}
module.exports = {
  authenticateToken,
};
