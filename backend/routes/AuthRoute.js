import express from "express";
const router = express.Router()

import { Login, registerUser, resetPasswordToken, resetPassword, verifyOtp } from "../controller/AuthController.js";

router.post('/signup', registerUser);
router.post('/verifyOtp', verifyOtp);
router.post('/login', Login);
router.post('/reset-password-token', resetPasswordToken);
router.post('/reset-password/:id', resetPassword);

export default router;