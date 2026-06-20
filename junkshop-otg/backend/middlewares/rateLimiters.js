const rateLimit = require('express-rate-limit');

function rateLimitResponse(req, res) {
  res.status(429).json({
    message: 'Too many requests. Please try again later.',
  });
}

/** Contact form — 5 submissions per hour per IP */
const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

/** Login, register, password reset — 10 attempts per 15 minutes per IP */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

/** Map geocode / route proxy — 60 requests per 15 minutes per IP */
const mapsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitResponse,
});

module.exports = {
  contactLimiter,
  authLimiter,
  mapsLimiter,
};
