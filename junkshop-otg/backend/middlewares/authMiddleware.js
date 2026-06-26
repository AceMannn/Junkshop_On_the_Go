const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { SESSION_USER_EXCLUDE } = require('../utils/userQueries');

const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const [scheme, token] = authHeader.split(' ');

    if (scheme !== 'Bearer' || !token) {
      return res.status(401).json({ message: 'Not authorized. Please log in.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(SESSION_USER_EXCLUDE);

    if (!user) {
      return res.status(401).json({ message: 'Account no longer exists.' });
    }

    if (user.status !== 'active') {
      return res.status(403).json({ message: 'This account is not active.' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Session expired. Please log in again.' });
  }
};

module.exports = { protect };
