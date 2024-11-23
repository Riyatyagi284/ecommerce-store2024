import mongoose from "mongoose";

const tagSchema = new mongoose.Schema({
    tag_id: {
        type: String,
        required: true,
        trim: true,
        unique: true
    },
    name: {
        type: String,
        required: true,
        trim: true,
        required: true
    },
    description: {
        type: String,
        trim: true,
        required: true
    },
    // related_tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag'}],
    productId: [{ type: String }],
    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now }
    }
});

const Tag = mongoose.model('Tag', tagSchema);

export default Tag;