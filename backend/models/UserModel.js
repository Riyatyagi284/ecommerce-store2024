import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // userId: {
    //     type: Schema.Types.UUID,
    // },
    userId: {
        type: String,
    },
    // 
    googleId: { type: String, required: true },
    googleName: { type: String },
    googleEmail: { type: String },
    googleProfilePhoto: { type: String },
    // 
    email: {
        type: String,
        format: 'email',
        // required: true,
    },
    password: {
        type: String,
        // required: true,
        minlength: 8,
    },
    confirmPassword: {
        type: String,
        // required: true,
        minlength: 8,
    },
    firstName: {
        type: String,
        minLength: 1,
        maxLength: 100,
    },
    lastName: {
        type: String,
        minLength: 1,
        maxLength: 100,
    },
    phone: {
        type: String,
        match: /^[0-9]{10,15}$/,
        // required: true,
    },
    dateOfBirth: {
        type: String,
        format: Date,
    },
    gender: {
        type: String,
        enum: ["Male", "Female", "Other", "Prefer not to say"],
    },
    resetPasswordToken: {
        type: String,
    },
    resetPasswordExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    addresses: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserShippingAddress'
        },],

    paymentMethods: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPaymentMethod' },

    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Wishlist' }],

    cart: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cart' }],

    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],

    reviews: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Review' }],

    recentlyViewed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'RecentlyViewed' }],

    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],

    loyaltyPoints: {
        pointsEarned: {
            type: Number,
            minimum: 0
        },
        pointsSpent: {
            type: Number,
            minimum: 0
        },
        pointsAvailable: {
            type: Number,
            minimum: 0
        }
    },

    accountStatus: {
        type: String,
        enum: ["Active", "Suspended", "Banned"],
    },
    role: {
        type: String,
        enum: ["Customer", "Admin"],
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    }
});

export const User = mongoose.model('User', userSchema);