import mongoose from "mongoose"

const userPaymentMethodSchema = new mongoose.Schema({
    paymentMethodId: { type: String, required: true },

    cardType: { type: String, required: true, enum: ["Visa", "MasterCard", "Amex", "Discover"] },

    cardLast4Digits: { type: String, required: true },
    expirationDate: { type: Date, required: true },

    cardHolderName: {type: String, required: true },
    
    billingAddress: {
        fullName: { type: String, required: true },
        addressLine1: { type: String, required: true },
        city: { type: String, required: true },
        state: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    }
});

const UserPaymentMethod = mongoose.model('UserPaymentMethod', userPaymentMethodSchema);
module.exports = UserPaymentMethod;
