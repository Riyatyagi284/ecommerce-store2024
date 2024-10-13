import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    cartId: { type: String, required: true },
    userId: { type: String, required: true },
    sessionId: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },

    items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }],

    subtotal: { type: Number, required: true },
    discounts: {
        totalDiscount: { type: Number },
        discountsApplied: [
            {
                discountId: { type: String },
                description: { type: String }
            }
        ]
    },
    tax: {
        taxPercentage: { type: Number },
        taxAmount: { type: Number }
    },
    shippingCost: { type: Number },
    total: { type: Number, required: true },
    currency: { type: String, required: true },

    userShippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'UserShippingAddress' },

    userPaymentMethod: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPaymentMethod' },

    promotions: [
        {
            promotionId: { type: String },
            description: { type: String },
            applied: { type: Boolean }
        }
    ],
    loyaltyPoints: {
        earnedPoints: { type: Number },
        redeemedPoints: { type: Number },
        availablePoints: { type: Number }
    },
    cartNotes: { type: String },
    isGift: { type: Boolean, default: false },

    savedForLater: { type: Boolean, default: false }, // save for future use
});

export const Cart = mongoose.model('Cart', cartSchema);