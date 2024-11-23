import mongoose from "mongoose";

const categorySchema = new mongoose.Schema({
    category_id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    }
});

export const Category = mongoose.Model('Category', categorySchema);