import Tag from "../models/TagsModel.js";

export const validateTags = async (relatedTags) => {
    const tags = await Tag.find({ _id: { $in: relatedTags }});
    if(tags.length !== relatedTags.length) {
        return null;
    }
    return relatedTags;
}