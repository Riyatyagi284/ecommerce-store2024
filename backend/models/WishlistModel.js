import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema({
    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],
    addedAt: {
        type: string,
        format: date,
        required: true,
    }
})

export const Wishlist = mongoose.model('Wishlist', wishlistSchema);