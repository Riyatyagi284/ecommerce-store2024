export const checkBlacklistedToken = (req, res, next) => {
    const token = req.cookies.token;
    if (blacklistedTokens.has(token)) {
      return res.status(403).json({ success: false, message: "This session is revoked. Please log in again." });
    }
    next();
  };
  