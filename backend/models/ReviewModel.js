import mongoose from "mongoose";

// image can be include in the schema
const reviewSchema = new mongoose.Schema({
    reviewId: {
        type: UUID,
        required: true
    },
    productId: {
        type: UUID,
        required: true
    },
    rating: {
        type: number,
        minimum: 1,
        maximum: 5,
        required: true
    },
    title: {
        type: string,
        minLength: 1,
        maxLength: 255,
        required: true
    },
    body: {
        type: string,
        minLength: 1,
        maxLength: 1000,
        required: true
    },
    createdAt: {
        type: string,
        format: "date",
        required: true
    },
    verifiedPurchase: {
        type: "boolean",
        default: false
    }
})

export const Review = mongoose.model('Review', reviewSchema);