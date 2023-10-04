const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, process.env.ACCESS_TOKEN_PRIVATE_KEY, (err, user) => {
    if (err) {
      console.log(err.name);
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'expired' });
      }
      return res.sendStatus(403);
    }
    req.user = user;

    next();
  });
}
module.exports = {
  authenticateToken,
};
