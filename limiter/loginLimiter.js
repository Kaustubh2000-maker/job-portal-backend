const redisClient = require("../config/redis");

const loginLimiter = async (req, res, next) => {
  try {
    const ip = req.ip;
    const key = `login:${ip}`;

    const attempts = await redisClient.get(key);

    if (attempts && Number(attempts) >= 5) {
      return res.status(429).json({
        status: "fail",
        message: "Too many login attempts. Try again after 1 minute.",
      });
    }

    if (!attempts) {
      await redisClient.setEx(key, 60, "1");
    } else {
      await redisClient.incr(key);
    }

    next();
  } catch (err) {
    console.error("Redis login limiter error:", err);
    next();
  }
};

module.exports = loginLimiter;
