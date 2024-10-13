import mongoose from "mongoose";

const userShippingAddressSchema = new mongoose.Schema({
    addressId: {
        type: Schema.Type.UUID,
        required: true,
    },
    fullName: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
    phone: { type: String }
});

const UserShippingAddress = mongoose.model('UserShippingAddress', userShippingAddressSchema);

module.exports = UserShippingAddress;