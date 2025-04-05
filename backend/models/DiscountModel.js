import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define the schema for the discount
const discountSchema = new Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ['percentage', 'flat'],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minPurchaseAmount: {
        type: Number,
        required: true
    },
    maxUsage: {
        type: Number,
        required: true
    },
    validFrom: {
        type: Date,
        required: true
    },
    validUntil: {
        type: Date,
        required: true,
        index: { expires: 0 },
    }
}, { timestamps: true });

export const Discount = mongoose.model('Discount', discountSchema);