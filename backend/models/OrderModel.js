import mongoose from 'mongoose';
const { Schema } = mongoose;

const orderSchema = new Schema({
    orderId: { type: String, required: true, unique: true },
    userId: { type: String, required: true },

    products: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' },],

    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'UserShippingAddress' },

    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'UserShippingAddress' },

    paymentDetails: { type: mongoose.Schema.Types.ObjectId, ref: 'UserPaymentMethod' },

    orderStatus: {
        status: { type: String, enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'], required: true },
        isPaid: { type: Boolean, default: false },
        isShipped: { type: Boolean, default: false },
        isDelivered: { type: Boolean, default: false },
        isCancelled: { type: Boolean, default: false },
        cancelReason: { type: String },
        trackingDetails: {
            carrier: { type: String },
            trackingNumber: { type: String },
            estimatedDelivery: { type: Date },
            shippedAt: { type: Date },
            deliveredAt: { type: Date }
        }
    },
    shippingCost: { type: Number, default: 0 },
    discounts: [{
        code: { type: String },
        description: { type: String },
        amount: { type: Number }
    }],
    taxes: [{
        type: { type: String },
        rate: { type: Number },
        amount: { type: Number }
    }],
    totalAmount: { type: Number, required: true },
    couponsApplied: [{
        code: { type: String },
        description: { type: String },
        discountAmount: { type: Number }
    }],
    orderNotes: { type: String },
    giftWrapping: {
        isGiftWrapped: { type: Boolean, default: false },
        message: { type: String }
    },
    meta: {
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date }
    }
});

module.exports = mongoose.model('Order', orderSchema);
