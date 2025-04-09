import mongoose from "mongoose";

const userShippingAddressSchema = new mongoose.Schema({
    // addressId: {
    //     type: Schema.Type.UUID,
    //     required: true,
    // },
    fullName: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, required: true, trim: true },
    phone: { type: String },
    isDefault: { type: Boolean, default: false },
    userId: { type: String, required: true, trim: true }
}, { timestamps: true });

export const UserShippingAddress = mongoose.model('UserShippingAddress', userShippingAddressSchema);