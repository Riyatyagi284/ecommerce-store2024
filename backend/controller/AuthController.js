import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt from "jsonwebtoken";
import { generateOtp } from "../utils/generateOtp.js";
import { sendOtpEmail } from "../utils/sendOtp.js"; // need to add variable after that this is also working
import { UnverifiedUser } from '../models/UnverifiedUserModel.js';
import { User } from "../models/UserModel.js";


const OTP_EXPIRATION_TIME = 10 * 60 * 1000; // 10 minutes
const RESEND_OTP_LIMIT = 60 * 1000; // 1 minute


export const registerUser = [
    body("email").isEmail().withMessage("Invalid email format"),
    body("phone").isMobilePhone().withMessage("Invalid phone number"),
    body("password").notEmpty().withMessage("Password cannot be empty")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("confirmPassword").notEmpty().withMessage("Confirm Password cannot be empty")
        .custom((value, { req }) => {
            if (value !== req.body.password) throw new Error("Passwords do not match");
            return true;
        }),

    async (req, res) => {

        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, phone, password, confirmPassword } = req.body;

            if (!email || !phone || !password || !confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'All fields are required to fill',
                })
            }

            const existingUser = await User.findOne({ $or: [{ email }, { phone }] });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'User already exist , Please signIn to continue',
                })
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Generate OTP
            const otp = generateOtp();
            const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes validity

            // Create new user (not verified yet)
            const unverifiedUser = new UnverifiedUser({ email, phone, password: hashedPassword, otp, otpExpires, isVerified: false });

            // donot save newUser till email-verification process

            await unverifiedUser.save();

            // Send OTP via Email
            // await sendOtpEmail(email, otp);

            res.status(201).json({ message: "OTP sent. Please verify your email." });

        } catch (error) {
            console.log('register error in auth', error);
            res.status(500).json({ message: 'Error registering user', error: error.message });
        }
    }
]

export const verifyOtp = [
    body("email").isEmail().withMessage("Invalid email format"),
    body("otp").isLength({ min: 6, max: 6 }).withMessage("Invalid OTP format"),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, otp } = req.body;
            const unverifiedUser = await UnverifiedUser.findOne({ email });

            if (!unverifiedUser) {
                return res.status(404).json({ message: "User not found or not registered" });
            }

            if (unverifiedUser.isVerified) {
                return res.status(400).json({ message: "User already verified" });
            }

            if (unverifiedUser.otp !== otp) {
                return res.status(400).json({ message: "Invalid OTP" });
            }

            if (unverifiedUser.otpExpires < new Date()) {
                return res.status(400).json({ message: "OTP has expired" });
            }

            const newUser = new User({
                email: unverifiedUser.email,
                phone: unverifiedUser.phone,
                password: unverifiedUser.password,
                isVerified: true
            });

            await newUser.save();

            await UnverifiedUser.deleteOne({ email });

            res.status(200).json({ message: "OTP verified. Account activated." });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
]

export const Login = [
    body("email").isEmail().withMessage("Invalid email format").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required"),
    body("rememberMe").optional().isBoolean().withMessage("Invalid rememberMe value"),

    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

        try {
            const { email, password, rememberMe } = req.body;
            const user = await User.findOne({ email });

            if (!user) return res.status(404).json({ message: "User not found" });

            if (!user.isVerified) return res.status(403).json({ message: "You aren't verified. Please verify first." });

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

            // Generate JWT
            const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "24h" });

            // Save token to user document in database
            user.token = token
            user.password = undefined

            // cookie options
            const options = {
                expires: new Date(Date.now() + (rememberMe ? 7 : 3) * 24 * 60 * 60 * 1000),
                httpOnly: true,
                // secure: process.env.NODE_ENV === "production", 
                sameSite: "Strict", // CSRF protection
            }

            console.log('cookie options', options);

            res.cookie("token", token, options).status(200).json({
                success: true,
                token,
                user,
                message: `User Login successfully`,
            })
        } catch (error) {
            res.status(500).json({ message: "Login error", error: error.message });
        }
    }
]


// Resend OTP API (testing left in resend otp)
export const resendOTP = [
    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    async (req, res) => {
        try {
            // Validate input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { email } = req.body;

            // Check if user exists
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `This email (${email}) is not registered with us.`,
                });
            }

            // Rate limit check: Prevent spamming OTP requests
            if (user.lastOTPRequest && Date.now() - user.lastOTPRequest < RESEND_OTP_LIMIT) {
                return res.status(429).json({
                    success: false,
                    message: "Too many requests. Please wait before requesting again.",
                });
            }

            // Generate a new OTP (6-digit random number)
            const otp = Math.floor(100000 + Math.random() * 900000).toString();

            // Hash the OTP before storing (for security)
            const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

            // Update user document with new OTP and expiry
            await User.findByIdAndUpdate(user._id, {
                otp: hashedOTP,
                otpExpires: Date.now() + OTP_EXPIRATION_TIME,
                lastOTPRequest: Date.now(), // Update last request time
            });

            // Send OTP via email
            await mailSender(
                email,
                "Your OTP Code",
                `Your OTP is: ${otp}. This OTP is valid for 10 minutes.`
            );

            res.status(200).json({
                success: true,
                message: "OTP sent successfully. Please check your email.",
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: "Error sending OTP",
                error: error.message,
            });
        }
    }
]

// these two working
export const resetPasswordToken = [
    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),
    async (req, res) => {
        try {
            // Validate email input
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const email = req.body.email.toLowerCase();
            const user = await User.findOne({ email });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    message: `No account found with this email: ${email}`,
                });
            }

            // Generate a secure reset token
            const token = crypto.randomBytes(32).toString("hex");
            const resetPasswordExpires = Date.now() + 3600000; // 1 hour

            // Store hashed token for security
            const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            await User.findOneAndUpdate(
                { email },
                {
                    resetPasswordToken: hashedToken,
                    resetPasswordExpires,
                },
                { new: true }
            );

            const resetUrl = `http://localhost:4000/api/v1/auth/reset-password/${token}`;

            // Send email with reset link

            // await mailSender(
            //     email,
            //     "Password Reset",
            //     `Click this link to reset your password: ${resetUrl} \n This link will expire in 1 hour.`
            // );

            // console.log(
            //     email,
            //     "Password Reset",
            //     `Click this link to reset your password: ${resetUrl} \n This link will expire in 1 hour.`
            // );

            res.status(200).json({
                success: true,
                message: "Password reset email sent successfully.",
            });

        } catch (error) {
            console.error("Error in resetPasswordToken:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    }
]

export const resetPassword = [
    body("email")
        .isEmail()
        .withMessage("Invalid email format")
        .normalizeEmail(),

    body("password")
        .isLength({ min: 8 })
        .withMessage("Password must be at least 8 characters long")
        .matches(/\d/)
        .withMessage("Password must contain at least one number")
        .matches(/[A-Z]/)
        .withMessage("Password must contain at least one uppercase letter"),
        // .run(req),

    body("confirmPassword")
        .custom((value, { req }) => value === req.body.password)
        .withMessage("Passwords do not match"),
        // .run(req),

    body("token").notEmpty().withMessage("Token is required"),
    // .run(req),

    async (req, res) => {
        try {
            // Validate inputs
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { password, token } = req.body;

            // Hash token for secure lookup
            // const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

            // console.log("hashed token",hashedToken);

            const user = await User.findOne({
                // resetPasswordToken: hashedToken,
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }, // Check if token is still valid
            });

            console.log('user', user);

            if (!user) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid or expired token",
                });
            }

            // Hash new password
            const hashedPassword = await bcrypt.hash(password, 12);

            // Update password and remove token
            await User.findOneAndUpdate(
                { _id: user._id },
                {
                    password: hashedPassword,
                    resetPasswordToken: null,
                    resetPasswordExpires: null,
                },
                { new: true }
            );

            res.status(200).json({
                success: true,
                message: "Password has been reset successfully.",
            });

        } catch (error) {
            console.error("Error in resetPassword:", error);
            res.status(500).json({
                success: false,
                message: "Internal Server Error",
            });
        }
    }
]

// next things to do

// 1. OAuth 2.0
// 2. Security Enhancements : 1. Rate Limiting (Brute Force Prevention)
                            // 2. Secure Logout API (Clears cookies, prevents reuse)
                            // 3. Two-Factor Authentication 
                            // 4. Token Revocation Support (JWT Blacklisting)