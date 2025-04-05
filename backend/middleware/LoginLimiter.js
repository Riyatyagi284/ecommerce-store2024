import rateLimit from "express-rate-limit";

// Limit login attempts to 5 per 15 minutes (prevents brute force attacks)
export const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts
    message: { success: false, message: "Too many login attempts. Please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
});