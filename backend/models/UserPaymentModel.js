import mongoose from "mongoose"

const userPaymentMethodSchema = new mongoose.Schema({
    paymentMethodId: { type: String, required: true },

    cardType: { type: String, required: true, enum: ["Visa", "MasterCard", "Amex", "Discover"] },

    cardLast4Digits: { type: String, required: true },
    expirationDate: { type: Date, required: true },

    cardHolderName: { type: String, required: true },

    billingAddress: {
        fullName: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        addressLine1: { type: String, required: true, trim: true },
        addressLine2: { type: String, trim: true },
        city: { type: String, required: true, trim: true },
        state: { type: String, required: true, trim: true },
        postalCode: { type: String, required: true, trim: true },
        country: { type: String, required: true, trim: true },
        paymentMethod: { type: String, enum: ["card", "paypal", "upi", "crypto"], required: true }, 
        isDefault: { type: Boolean, default: false },
    }
}, { timestamps: true });

export const UserPaymentMethod = mongoose.model('UserPaymentMethod', userPaymentMethodSchema);