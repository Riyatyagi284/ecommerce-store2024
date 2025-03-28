import mongoose from 'mongoose';

const UnverifiedUserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true },
    password: { type: String, required: true },
    otp: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    isVerified: { type: Boolean, default: false },
});

const UnverifiedUser = mongoose.model('UnverifiedUser', UnverifiedUserSchema);

export { UnverifiedUser };
