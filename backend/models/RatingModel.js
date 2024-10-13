import mongoose from "mongoose";

const ratingSchema = new mongoose.Schema({
    average_rating: { type: Number, min: 0, max: 5 },
    total_ratings: { type: Number, min: 0 },
    breakdown: {
        1: { type: Number, min: 0 },
        2: { type: Number, min: 0 },
        3: { type: Number, min: 0 },
        4: { type: Number, min: 0 },
        5: { type: Number, min: 0 }
    }
});

export const Rating = mongoose.model('Rating', ratingSchema);