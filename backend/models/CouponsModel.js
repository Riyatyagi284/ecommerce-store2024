import mongoose from "mongoose";
const { Schema } = mongoose;

const couponSchema = new Schema({
    couponId: { type: String, required: true, unique: true },
    code: { type: String, required: true },
    description: { type: String },
    discountType: { type: String, enum: ['Percentage', 'Fixed'], required: true },
    discountAmount: { type: Number, required: true },
    minimumPurchaseAmount: { type: Number, required: true },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usageLimit: {
        total: { type: Number, required: true },
        perUser: { type: Number, required: true }
    },
    appliedTo: {
        categories: [{ type: String }],
        products: [{ type: String }]
    },
    exclusions: {
        categories: [{ type: String }],
        products: [{ type: String }]
    },
    redemption: {
        timesUsed: { type: Number, default: 0 },
        userRedemptions: {
            type: Map,
            of: Number // Maps userId to the number of redemptions by that user
        }
    },
    stackable: { type: Boolean, default: false },
    couponType: { type: String, enum: ['Standard', 'Exclusive'], default: 'Standard' },
    termsAndConditions: { type: String },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date }
    }
}, {
    timestamps: true // Automatically adds createdAt and updatedAt fields
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;