import express from "express";
const router = express.Router();

import passport from 'passport';

import { Login, registerUser, resetPasswordToken, resetPassword, verifyOtp } from "../controller/AuthController.js";
import { loginLimiter } from "../middleware/LoginLimiter.js";
import { checkBlacklistedToken } from "../middleware/checkBlackListedToken.js";

router.post('/signup', registerUser);
router.post('/verifyOtp', verifyOtp);
router.post('/login', loginLimiter, checkBlacklistedToken, Login);
router.post('/reset-password-token', resetPasswordToken);
router.post('/reset-password/:id', resetPassword);


// ################### OAuth20 Authentication ###################### //

// Google OAuth login route

router.get(
    "/google",
    passport.authenticate("google", { scope: ["profile", "email"] })
);

// Google OAuth callback route
router.get(
    "/google/callback",
    passport.authenticate("google", { failureRedirect: "/" }),
    (req, res) => {
        // res.redirect("/dashboard"); // Redirect to frontend/dashboard after successful login
        return res.send('<h2>Successfully Login!!</h2>');
    }
);

// Logout route
router.get("/logout", (req, res) => {
    req.logout((err) => {
        if (err) return res.send(err);
        res.redirect("/");
    });
});

// Get current user
router.get("/current-user", (req, res) => {
    res.send(req.user);
});

export default router;