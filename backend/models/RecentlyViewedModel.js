import mongoose from "mongoose";

const recentlyViewedSchema = new mongoose.Schema({
    productId: {
        type: UUID,
        required: true
    },
    viewedAt: {
        type: string,
        format: date,
        required: true
    }
})

export const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema);